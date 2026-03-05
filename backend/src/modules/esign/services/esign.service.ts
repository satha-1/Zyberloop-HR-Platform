import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { PdfTemplate, IPdfTemplate } from '../pdfTemplate.model';
import { PdfTemplateVersion, IPdfTemplateVersion, IOverlayField } from '../pdfTemplateVersion.model';
import { SignRequestEnvelope, ISignRequestEnvelope, IAuditEvent } from '../signRequestEnvelope.model';
import { SignRequestFieldValue, ISignRequestFieldValue } from '../signRequestFieldValue.model';
import { SignatureAsset, ISignatureAsset } from '../signatureAsset.model';
import { esignStorageService } from './esignStorage.service';
import { pdfService } from './pdf.service';
import { esignEmailService } from './esignEmail.service';
import { AppError } from '../../../middlewares/errorHandler';
import { config } from '../../../config';
import { Document as DocumentHub } from '../../documents/document.model';

class EsignService {
  private generateSigningToken() {
    const tokenRaw = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(tokenRaw).digest('hex');
    return { tokenRaw, tokenHash };
  }

  private getCurrentRecipient(envelope: ISignRequestEnvelope) {
    return envelope.recipients
      .filter((r) => ['sent', 'viewed'].includes(r.status))
      .sort((a, b) => a.signingOrder - b.signingOrder)[0];
  }

  private getPendingRecipientsByNextOrder(envelope: ISignRequestEnvelope) {
    const pending = envelope.recipients.filter((r) => r.status === 'pending');
    if (pending.length === 0) return [];
    const nextOrder = Math.min(...pending.map((r) => r.signingOrder));
    return pending.filter((r) => r.signingOrder === nextOrder);
  }

  // ─── SIGNATURE ASSETS ───────────────────────────────────

  async createSignatureAsset(data: {
    ownerUserId: string;
    type: string;
    method: string;
    label?: string;
    typedText?: string;
    fontName?: string;
    vectorData?: string;
    fileBuffer: Buffer;
    mimeType: string;
  }): Promise<ISignatureAsset> {
    const assetId = new mongoose.Types.ObjectId();
    const ext = data.mimeType.includes('svg') ? 'svg' : 'png';
    const s3Key = esignStorageService.signatureAssetKey(data.ownerUserId, assetId.toString(), ext);

    await esignStorageService.putObject(s3Key, data.fileBuffer, data.mimeType);

    const asset = new SignatureAsset({
      _id: assetId,
      ownerUserId: new mongoose.Types.ObjectId(data.ownerUserId),
      type: data.type,
      method: data.method,
      label: data.label,
      typedText: data.typedText,
      fontName: data.fontName,
      vectorData: data.vectorData,
      s3Key,
      mimeType: data.mimeType,
      size: data.fileBuffer.length,
      isDefault: false,
    });

    return await asset.save();
  }

  async getSignatureAssets(userId: string, type?: string): Promise<ISignatureAsset[]> {
    const query: any = { ownerUserId: new mongoose.Types.ObjectId(userId) };
    if (type) query.type = type;
    return SignatureAsset.find(query).sort({ createdAt: -1 });
  }

  async setSignatureAssetDefault(assetId: string, userId: string): Promise<ISignatureAsset> {
    const asset = await SignatureAsset.findOne({
      _id: assetId,
      ownerUserId: new mongoose.Types.ObjectId(userId),
    });
    if (!asset) throw new AppError(404, 'Signature asset not found');

    // Unset previous default of same type
    await SignatureAsset.updateMany(
      { ownerUserId: asset.ownerUserId, type: asset.type, isDefault: true },
      { isDefault: false }
    );

    asset.isDefault = true;
    return await asset.save();
  }

  async deleteSignatureAsset(assetId: string, userId: string): Promise<void> {
    const asset = await SignatureAsset.findOne({
      _id: assetId,
      ownerUserId: new mongoose.Types.ObjectId(userId),
    });
    if (!asset) throw new AppError(404, 'Signature asset not found');

    await esignStorageService.deleteObject(asset.s3Key);
    await asset.deleteOne();
  }

  // ─── PDF TEMPLATES ──────────────────────────────────────

  async createTemplate(data: {
    name: string;
    description?: string;
    createdByUserId: string;
    pdfBuffer: Buffer;
  }): Promise<{ template: IPdfTemplate; version: IPdfTemplateVersion }> {
    const templateId = new mongoose.Types.ObjectId();
    const versionNumber = 1;

    // Extract page info
    const { pageCount, pageSizes } = await pdfService.extractPageInfo(data.pdfBuffer);
    const pdfHash = esignStorageService.computeHash(data.pdfBuffer);

    // Upload to S3
    const s3Key = esignStorageService.templateSourceKey(templateId.toString(), versionNumber);
    await esignStorageService.putObject(s3Key, data.pdfBuffer, 'application/pdf');

    // Create version
    const version = new PdfTemplateVersion({
      templateId,
      versionNumber,
      sourcePdfS3Key: s3Key,
      sourcePdfHashSha256: pdfHash,
      pageCount,
      pageSizes,
      overlayDefinition: [],
      status: 'draft',
    });
    await version.save();

    // Create template
    const template = new PdfTemplate({
      _id: templateId,
      name: data.name,
      description: data.description,
      createdByUserId: new mongoose.Types.ObjectId(data.createdByUserId),
      status: 'draft',
      latestVersionId: version._id,
    });
    await template.save();

    return { template, version };
  }

  async getTemplates(filters?: { status?: string }): Promise<IPdfTemplate[]> {
    const query: any = {};
    if (filters?.status) query.status = filters.status;
    return PdfTemplate.find(query).sort({ createdAt: -1 });
  }

  async getTemplateById(templateId: string): Promise<IPdfTemplate> {
    const template = await PdfTemplate.findById(templateId);
    if (!template) throw new AppError(404, 'Template not found');
    return template;
  }

  async getTemplateVersion(versionId: string): Promise<IPdfTemplateVersion> {
    const version = await PdfTemplateVersion.findById(versionId);
    if (!version) throw new AppError(404, 'Template version not found');
    return version;
  }

  async getTemplateVersions(templateId: string): Promise<IPdfTemplateVersion[]> {
    return PdfTemplateVersion.find({ templateId: new mongoose.Types.ObjectId(templateId) }).sort({
      versionNumber: -1,
    });
  }

  async createNewVersion(templateId: string): Promise<IPdfTemplateVersion> {
    const template = await this.getTemplateById(templateId);
    const latestVersion = await PdfTemplateVersion.findById(template.latestVersionId);
    if (!latestVersion) throw new AppError(404, 'No existing version found');

    const newVersionNumber = latestVersion.versionNumber + 1;

    // Clone the source PDF key (copy the file in S3 if needed, or reference same key)
    const newS3Key = esignStorageService.templateSourceKey(templateId, newVersionNumber);

    // For simplicity, we reuse the same source PDF. In production you might copy the S3 object.
    const version = new PdfTemplateVersion({
      templateId: new mongoose.Types.ObjectId(templateId),
      versionNumber: newVersionNumber,
      sourcePdfS3Key: latestVersion.sourcePdfS3Key, // reuse same source
      sourcePdfHashSha256: latestVersion.sourcePdfHashSha256,
      pageCount: latestVersion.pageCount,
      pageSizes: latestVersion.pageSizes,
      overlayDefinition: [...latestVersion.overlayDefinition], // clone overlay
      status: 'draft',
    });
    await version.save();

    template.latestVersionId = version._id as mongoose.Types.ObjectId;
    template.status = 'draft';
    await template.save();

    return version;
  }

  async updateVersionOverlay(
    versionId: string,
    overlayDefinition: IOverlayField[],
    name?: string
  ): Promise<IPdfTemplateVersion> {
    const version = await PdfTemplateVersion.findById(versionId);
    if (!version) throw new AppError(404, 'Template version not found');
    if (version.status === 'published') {
      throw new AppError(400, 'Cannot edit a published version');
    }

    version.overlayDefinition = overlayDefinition;
    await version.save();

    // Update template name if provided
    if (name) {
      await PdfTemplate.findByIdAndUpdate(version.templateId, { name });
    }

    return version;
  }

  async publishVersion(versionId: string): Promise<IPdfTemplateVersion> {
    const version = await PdfTemplateVersion.findById(versionId);
    if (!version) throw new AppError(404, 'Template version not found');
    if (version.status === 'published') throw new AppError(400, 'Already published');

    version.status = 'published';
    version.publishedAt = new Date();
    await version.save();

    await PdfTemplate.findByIdAndUpdate(version.templateId, {
      status: 'published',
      latestVersionId: version._id,
    });

    return version;
  }

  async duplicateTemplate(templateId: string, userId: string): Promise<{ template: IPdfTemplate; version: IPdfTemplateVersion }> {
    const original = await this.getTemplateById(templateId);
    const originalVersion = await PdfTemplateVersion.findById(original.latestVersionId);
    if (!originalVersion) throw new AppError(404, 'No version to duplicate');

    const newTemplateId = new mongoose.Types.ObjectId();
    const newVersion = new PdfTemplateVersion({
      templateId: newTemplateId,
      versionNumber: 1,
      sourcePdfS3Key: originalVersion.sourcePdfS3Key,
      sourcePdfHashSha256: originalVersion.sourcePdfHashSha256,
      pageCount: originalVersion.pageCount,
      pageSizes: originalVersion.pageSizes,
      overlayDefinition: [...originalVersion.overlayDefinition],
      status: 'draft',
    });
    await newVersion.save();

    const newTemplate = new PdfTemplate({
      _id: newTemplateId,
      name: `${original.name} (Copy)`,
      description: original.description,
      createdByUserId: new mongoose.Types.ObjectId(userId),
      status: 'draft',
      latestVersionId: newVersion._id,
    });
    await newTemplate.save();

    return { template: newTemplate, version: newVersion };
  }

  // ─── SIGN REQUEST ENVELOPES ─────────────────────────────

  async createEnvelope(data: {
    templateId: string;
    templateVersionId: string;
    displayName: string;
    createdByUserId: string;
    recipients: Array<{
      name: string;
      email: string;
      employeeId?: string;
      role?: string;
      signingOrder?: number;
    }>;
    expiryAt?: Date;
    reminderConfig?: { enabled: boolean; intervalDays: number };
    emailSubject?: string;
    emailBody?: string;
  }): Promise<ISignRequestEnvelope> {
    // Validate template version exists and is published
    const version = await PdfTemplateVersion.findById(data.templateVersionId);
    if (!version) throw new AppError(404, 'Template version not found');
    if (version.status !== 'published') throw new AppError(400, 'Template version must be published');

    const envelope = new SignRequestEnvelope({
      templateId: new mongoose.Types.ObjectId(data.templateId),
      templateVersionId: new mongoose.Types.ObjectId(data.templateVersionId),
      displayName: data.displayName,
      createdByUserId: new mongoose.Types.ObjectId(data.createdByUserId),
      status: 'draft',
      recipients: data.recipients.map((r, i) => ({
        recipientId: uuidv4(),
        employeeId: r.employeeId ? new mongoose.Types.ObjectId(r.employeeId) : undefined,
        name: r.name,
        email: r.email,
        role: r.role || 'employee',
        signingOrder: r.signingOrder || i + 1,
        status: 'pending',
      })),
      expiryAt: data.expiryAt,
      reminderConfig: data.reminderConfig,
      emailSubject: data.emailSubject,
      emailBody: data.emailBody,
      auditTrail: [
        {
          eventType: 'created',
          actorUserId: data.createdByUserId,
          actorRole: 'hr',
          timestamp: new Date(),
        },
      ],
    });

    return await envelope.save();
  }

  async sendEnvelope(envelopeId: string, senderName: string, ip?: string, userAgent?: string): Promise<ISignRequestEnvelope> {
    const envelope = await SignRequestEnvelope.findById(envelopeId);
    if (!envelope) throw new AppError(404, 'Envelope not found');
    if (envelope.status !== 'draft') throw new AppError(400, 'Envelope can only be sent from draft status');

    const { tokenRaw, tokenHash } = this.generateSigningToken();
    envelope.signingLinkTokenHash = tokenHash;
    envelope.status = 'sent';
    envelope.sentAt = new Date();

    // Only send to first signing order recipients.
    const firstOrder = Math.min(...envelope.recipients.map((r) => r.signingOrder));
    envelope.recipients.forEach((r) => {
      r.status = r.signingOrder === firstOrder ? 'sent' : 'pending';
    });

    // Add audit event
    envelope.auditTrail.push({
      eventType: 'sent',
      actorUserId: envelope.createdByUserId.toString(),
      actorRole: 'hr',
      timestamp: new Date(),
      ip,
      userAgent,
    });

    await envelope.save();

    // Send emails only to current order recipients.
    const frontendUrl = config.cors.frontendUrl || 'http://localhost:3000';
    const signingLink = `${frontendUrl}/sign/${tokenRaw}`;

    for (const recipient of envelope.recipients.filter((r) => r.status === 'sent')) {
      await esignEmailService.sendSignRequestEmail({
        recipientName: recipient.name,
        recipientEmail: recipient.email,
        documentName: envelope.displayName,
        senderName,
        signingLink,
        expiryDate: envelope.expiryAt,
        customSubject: envelope.emailSubject,
        customBody: envelope.emailBody,
      });
    }

    return envelope;
  }

  async getEnvelopes(filters?: {
    status?: string;
    employeeId?: string;
    templateId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    createdByUserId?: string;
  }): Promise<ISignRequestEnvelope[]> {
    const query: any = {};
    if (filters?.status) query.status = filters.status;
    if (filters?.templateId) query.templateId = new mongoose.Types.ObjectId(filters.templateId);
    if (filters?.createdByUserId) query.createdByUserId = new mongoose.Types.ObjectId(filters.createdByUserId);
    if (filters?.employeeId) {
      query['recipients.employeeId'] = new mongoose.Types.ObjectId(filters.employeeId);
    }
    if (filters?.dateFrom || filters?.dateTo) {
      query.createdAt = {};
      if (filters?.dateFrom) query.createdAt.$gte = filters.dateFrom;
      if (filters?.dateTo) query.createdAt.$lte = filters.dateTo;
    }
    return SignRequestEnvelope.find(query).sort({ createdAt: -1 });
  }

  async getEnvelopeById(envelopeId: string): Promise<ISignRequestEnvelope> {
    const envelope = await SignRequestEnvelope.findById(envelopeId);
    if (!envelope) throw new AppError(404, 'Envelope not found');
    return envelope;
  }

  async renameEnvelope(envelopeId: string, displayName: string): Promise<ISignRequestEnvelope> {
    const envelope = await SignRequestEnvelope.findById(envelopeId);
    if (!envelope) throw new AppError(404, 'Envelope not found');
    envelope.displayName = displayName;
    return await envelope.save();
  }

  async voidEnvelope(envelopeId: string, userId: string, ip?: string, userAgent?: string): Promise<ISignRequestEnvelope> {
    const envelope = await SignRequestEnvelope.findById(envelopeId);
    if (!envelope) throw new AppError(404, 'Envelope not found');
    if (['finalised', 'voided'].includes(envelope.status)) {
      throw new AppError(400, 'Cannot void this envelope');
    }

    envelope.status = 'voided';
    envelope.auditTrail.push({
      eventType: 'voided',
      actorUserId: userId,
      actorRole: 'hr',
      timestamp: new Date(),
      ip,
      userAgent,
    });
    return await envelope.save();
  }

  // ─── SIGNING FLOW (Recipient side) ─────────────────────

  async validateSigningToken(token: string): Promise<ISignRequestEnvelope> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const envelope = await SignRequestEnvelope.findOne({ signingLinkTokenHash: tokenHash });
    if (!envelope) throw new AppError(404, 'Invalid or expired signing link');

    if (['finalised', 'voided', 'expired', 'declined'].includes(envelope.status)) {
      throw new AppError(400, `This document is ${envelope.status}`);
    }

    if (envelope.expiryAt && new Date() > envelope.expiryAt) {
      envelope.status = 'expired';
      await envelope.save();
      throw new AppError(400, 'This signing link has expired');
    }

    return envelope;
  }

  async markViewed(token: string, ip?: string, userAgent?: string): Promise<ISignRequestEnvelope> {
    const envelope = await this.validateSigningToken(token);

    if (envelope.status === 'sent') {
      envelope.status = 'viewed';
    }

    const recipient = this.getCurrentRecipient(envelope);
    if (recipient) {
      recipient.status = 'viewed';
      recipient.viewedAt = new Date();
    }

    envelope.auditTrail.push({
      eventType: 'opened',
      actorEmail: recipient?.email,
      actorRole: 'employee',
      timestamp: new Date(),
      ip,
      userAgent,
    });

    return await envelope.save();
  }

  async submitFieldValue(
    token: string,
    fieldId: string,
    value: string | undefined,
    signatureAssetId?: string,
    signatureBuffer?: Buffer,
    ip?: string,
    userAgent?: string
  ): Promise<ISignRequestFieldValue> {
    const envelope = await this.validateSigningToken(token);
    if (!['viewed', 'in_progress', 'sent'].includes(envelope.status)) {
      throw new AppError(400, 'Cannot submit field values in current state');
    }

    // Update envelope status to in_progress
    if (envelope.status !== 'in_progress') {
      envelope.status = 'in_progress';
      await envelope.save();
    }

    const recipient = this.getCurrentRecipient(envelope);
    if (!recipient) throw new AppError(400, 'No active recipient');

    // Store signature image if provided
    let signatureS3Key: string | undefined;
    if (signatureBuffer) {
      signatureS3Key = `esign/envelopes/${envelope._id}/fields/${fieldId}.png`;
      await esignStorageService.putObject(signatureS3Key, signatureBuffer, 'image/png');
    }

    // Upsert field value
    const fieldValue = await SignRequestFieldValue.findOneAndUpdate(
      { envelopeId: envelope._id, fieldId },
      {
        envelopeId: envelope._id,
        fieldId,
        filledByRecipientId: recipient.recipientId,
        value,
        signatureAssetId: signatureAssetId ? new mongoose.Types.ObjectId(signatureAssetId) : undefined,
        signatureS3KeySnapshot: signatureS3Key,
        filledAt: new Date(),
        ip,
        userAgent,
      },
      { upsert: true, new: true }
    );

    // Add audit event
    envelope.auditTrail.push({
      eventType: 'field_completed',
      actorEmail: recipient.email,
      actorRole: 'employee',
      timestamp: new Date(),
      ip,
      userAgent,
      fieldId,
      signatureAssetId,
      signatureHash: signatureBuffer ? esignStorageService.computeHash(signatureBuffer) : undefined,
    });
    await envelope.save();

    return fieldValue!;
  }

  async completeSigning(
    token: string,
    ip?: string,
    userAgent?: string
  ): Promise<ISignRequestEnvelope> {
    const envelope = await this.validateSigningToken(token);
    if (!['viewed', 'in_progress'].includes(envelope.status)) {
      throw new AppError(400, 'Cannot complete signing in current state');
    }

    // Get template version + overlay
    const version = await PdfTemplateVersion.findById(envelope.templateVersionId);
    if (!version) throw new AppError(500, 'Template version not found');

    // Get all field values
    const fieldValues = await SignRequestFieldValue.find({ envelopeId: envelope._id });

    // Validate required fields
    const requiredFields = version.overlayDefinition.filter(
      (f) => f.required && f.type !== 'static_text'
    );
    for (const rf of requiredFields) {
      const fv = fieldValues.find((v) => v.fieldId === rf.fieldId);
      if (!fv || (!fv.value && !fv.signatureS3KeySnapshot)) {
        throw new AppError(400, `Required field "${rf.label || rf.fieldId}" is not filled`);
      }
    }

    // Load source PDF from S3 presigned URL only (strict S3-backed eSign flow).
    const sourcePdfUrl = await esignStorageService.getPresignedUrl(version.sourcePdfS3Key, 300);
    if (!sourcePdfUrl.startsWith('http')) {
      throw new AppError(500, 'Invalid source PDF URL. eSign requires S3-backed storage.');
    }
    const sourceResp = await fetch(sourcePdfUrl);
    const sourcePdfBuffer = Buffer.from(await sourceResp.arrayBuffer());

    // Build signature image buffers map
    const signatureImageBuffers = new Map<string, Buffer>();
    for (const fv of fieldValues) {
      if (fv.signatureS3KeySnapshot) {
        try {
          const sigUrl = await esignStorageService.getPresignedUrl(fv.signatureS3KeySnapshot, 300);
          if (!sigUrl.startsWith('http')) {
            throw new AppError(500, 'Invalid signature URL. eSign requires S3-backed storage.');
          }
          const resp = await fetch(sigUrl);
          const sigBuffer = Buffer.from(await resp.arrayBuffer());
          signatureImageBuffers.set(fv.fieldId, sigBuffer);
        } catch (e) {
          console.error(`Failed to load signature image for field ${fv.fieldId}:`, e);
        }
      }
    }

    // Stamp all values onto the PDF
    const { pdfBuffer: signedPdfBuffer, sha256: signedPdfHash } = await pdfService.stampFieldValues(
      sourcePdfBuffer,
      version.overlayDefinition,
      fieldValues as ISignRequestFieldValue[],
      signatureImageBuffers
    );

    // Update recipient status
    const activeRecipient = this.getCurrentRecipient(envelope);
    if (activeRecipient) {
      activeRecipient.status = 'signed';
      activeRecipient.signedAt = new Date();
    }

    // Add audit events
    envelope.auditTrail.push({
      eventType: 'signed',
      actorEmail: activeRecipient?.email,
      actorRole: 'employee',
      timestamp: new Date(),
      ip,
      userAgent,
    });

    // If there are remaining recipients, send the next order and wait for completion.
    const nextRecipients = this.getPendingRecipientsByNextOrder(envelope);
    if (nextRecipients.length > 0) {
      const { tokenRaw, tokenHash } = this.generateSigningToken();
      envelope.signingLinkTokenHash = tokenHash;
      envelope.status = 'sent';
      nextRecipients.forEach((r) => {
        r.status = 'sent';
      });
      await envelope.save();

      const frontendUrl = config.cors.frontendUrl || 'http://localhost:3000';
      const signingLink = `${frontendUrl}/sign/${tokenRaw}`;
      for (const recipient of nextRecipients) {
        await esignEmailService.sendSignRequestEmail({
          recipientName: recipient.name,
          recipientEmail: recipient.email,
          documentName: envelope.displayName,
          senderName: 'ZyberHR',
          signingLink,
          expiryDate: envelope.expiryAt,
          customSubject: envelope.emailSubject,
          customBody: envelope.emailBody,
        });
      }
      return envelope;
    }

    // Status transition explicitly tracks completed before finalisation.
    envelope.status = 'completed';

    // Store signed PDF
    const signedPdfKey = esignStorageService.envelopeSignedKey(envelope._id.toString());
    await esignStorageService.putObject(signedPdfKey, signedPdfBuffer, 'application/pdf');

    // Generate and store audit certificate
    const auditJson = pdfService.generateAuditCertificate(
      envelope.auditTrail as any[],
      envelope._id.toString(),
      signedPdfHash
    );
    const auditJsonKey = esignStorageService.envelopeAuditKey(envelope._id.toString());
    await esignStorageService.putObject(auditJsonKey, Buffer.from(auditJson), 'application/json');
    const auditPdfBuffer = await pdfService.generateAuditCertificatePdf(
      envelope.auditTrail as any[],
      envelope._id.toString(),
      signedPdfHash
    );
    const auditPdfKey = `esign/envelopes/${envelope._id.toString()}/audit.pdf`;
    await esignStorageService.putObject(auditPdfKey, auditPdfBuffer, 'application/pdf');

    // Update envelope
    envelope.status = 'finalised';
    envelope.finalisedAt = new Date();
    envelope.signedPdfS3Key = signedPdfKey;
    envelope.signedPdfHashSha256 = signedPdfHash;
    envelope.auditTrailS3Key = auditJsonKey;
    (envelope as any).auditTrailPdfS3Key = auditPdfKey;

    await envelope.save();
    await this.syncFinalisedEnvelopeToDocumentHub(
      envelope,
      version.versionNumber,
      signedPdfBuffer.length,
      auditPdfKey,
      auditPdfBuffer.length
    );

    // Send completion emails (async, don't block)
    this.sendCompletionEmails(envelope).catch((e) =>
      console.error('Failed to send completion emails:', e)
    );

    return envelope;
  }

  async processDueReminders(): Promise<number> {
    const now = new Date();
    const active = await SignRequestEnvelope.find({
      status: { $in: ['sent', 'viewed', 'in_progress'] },
      'reminderConfig.enabled': true,
      expiryAt: { $gt: now },
    });

    let sentCount = 0;
    for (const envelope of active) {
      const intervalDays = envelope.reminderConfig?.intervalDays || 3;
      const fromDate = envelope.lastReminderAt || envelope.sentAt || envelope.createdAt;
      const daysSince = (now.getTime() - new Date(fromDate).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < intervalDays) continue;

      const currentRecipients = envelope.recipients.filter((r) => ['sent', 'viewed'].includes(r.status));
      if (currentRecipients.length === 0) continue;

      const { tokenRaw, tokenHash } = this.generateSigningToken();
      envelope.signingLinkTokenHash = tokenHash;
      const signingLink = `${config.cors.frontendUrl || 'http://localhost:3000'}/sign/${tokenRaw}`;

      for (const recipient of currentRecipients) {
        await esignEmailService.sendReminderEmail({
          recipientName: recipient.name,
          recipientEmail: recipient.email,
          documentName: envelope.displayName,
          signingLink,
          expiryDate: envelope.expiryAt,
        });
        sentCount += 1;
      }

      envelope.lastReminderAt = now;
      envelope.reminderCount = (envelope.reminderCount || 0) + 1;
      envelope.auditTrail.push({
        eventType: 'reminder_sent',
        actorRole: 'system',
        timestamp: now,
      });
      await envelope.save();
    }

    return sentCount;
  }

  private async syncFinalisedEnvelopeToDocumentHub(
    envelope: ISignRequestEnvelope,
    templateVersion: number,
    signedPdfSizeBytes: number,
    auditPdfKey: string,
    auditPdfSizeBytes: number
  ) {
    if (!envelope.signedPdfS3Key || !envelope.signedPdfHashSha256) return;

    const existing = await DocumentHub.findOne({
      'renderInputSnapshot.redactedPreview.esignEnvelopeId': envelope._id.toString(),
    });
    if (existing) return;

    const firstRecipient = envelope.recipients[0];
    const subjectId = firstRecipient?.employeeId || firstRecipient?.email || envelope._id;
    const auditSha = esignStorageService.computeHash(Buffer.from(envelope.auditTrailS3Key || envelope._id.toString()));

    await DocumentHub.create({
      docType: 'ESIGN',
      templateId: envelope.templateId,
      templateVersion,
      subjectType: firstRecipient?.employeeId ? 'EMPLOYEE' : 'CANDIDATE',
      subjectId,
      status: 'SIGNED',
      renderInputSnapshot: {
        sha256: envelope.signedPdfHashSha256,
        redactedPreview: {
          esignEnvelopeId: envelope._id.toString(),
          displayName: envelope.displayName,
        },
      },
      artefacts: [
        {
          kind: 'SIGNED_PDF',
          objectKey: envelope.signedPdfS3Key,
          contentType: 'application/pdf',
          sha256: envelope.signedPdfHashSha256,
          sizeBytes: signedPdfSizeBytes,
          createdAt: new Date(),
        },
        {
          kind: 'AUDIT_CERTIFICATE',
          objectKey: auditPdfKey,
          contentType: 'application/pdf',
          sha256: auditSha,
          sizeBytes: auditPdfSizeBytes,
          createdAt: new Date(),
        },
      ],
      accessPolicy: {
        viewRoles: ['ADMIN', 'HR_ADMIN', 'HR'],
        downloadRoles: ['ADMIN', 'HR_ADMIN', 'HR'],
        subjectCanView: true,
      },
      createdBy: envelope.createdByUserId,
    });
  }

  private async sendCompletionEmails(envelope: ISignRequestEnvelope) {
    for (const recipient of envelope.recipients) {
      await esignEmailService.sendSigningCompleteEmail({
        recipientEmail: recipient.email,
        recipientName: recipient.name,
        documentName: envelope.displayName,
      });
    }
  }

  // ─── DOWNLOAD & AUDIT ──────────────────────────────────

  async getSignedPdfUrl(envelopeId: string): Promise<string> {
    const envelope = await this.getEnvelopeById(envelopeId);
    if (!envelope.signedPdfS3Key) throw new AppError(404, 'Signed PDF not available');
    return esignStorageService.getPresignedUrl(envelope.signedPdfS3Key, 60);
  }

  async getAuditTrailUrl(envelopeId: string): Promise<string> {
    const envelope = await this.getEnvelopeById(envelopeId);
    if (!envelope.auditTrailS3Key) throw new AppError(404, 'Audit trail not available');
    return esignStorageService.getPresignedUrl(envelope.auditTrailS3Key, 60);
  }

  async getSourcePdfUrl(s3Key: string): Promise<string> {
    return esignStorageService.getPresignedUrl(s3Key, 300);
  }
}

export const esignService = new EsignService();
