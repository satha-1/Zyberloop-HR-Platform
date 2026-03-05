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

class EsignService {
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

    // Generate signing token
    const tokenRaw = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(tokenRaw).digest('hex');

    envelope.signingLinkTokenHash = tokenHash;
    envelope.status = 'sent';
    envelope.sentAt = new Date();

    // Update all recipients to sent
    envelope.recipients.forEach((r) => {
      r.status = 'sent';
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

    // Send emails to each recipient
    const frontendUrl = config.cors.frontendUrl || 'http://localhost:3000';
    const signingLink = `${frontendUrl}/sign/${tokenRaw}`;

    for (const recipient of envelope.recipients) {
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

    // Mark first pending/sent recipient as viewed
    const recipient = envelope.recipients.find((r) => r.status === 'sent' || r.status === 'pending');
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

    const recipient = envelope.recipients.find((r) => r.status === 'viewed' || r.status === 'sent');
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

    // Load the source PDF
    const sourcePdfUrl = await esignStorageService.getPresignedUrl(version.sourcePdfS3Key, 300);
    let sourcePdfBuffer: Buffer;

    // Fetch the PDF (handle both presigned URL and local path)
    if (sourcePdfUrl.startsWith('http')) {
      const resp = await fetch(sourcePdfUrl);
      sourcePdfBuffer = Buffer.from(await resp.arrayBuffer());
    } else {
      // Local storage fallback
      const fs = await import('fs');
      const path = await import('path');
      const localPath = path.join(process.cwd(), sourcePdfUrl);
      sourcePdfBuffer = fs.readFileSync(localPath);
    }

    // Build signature image buffers map
    const signatureImageBuffers = new Map<string, Buffer>();
    for (const fv of fieldValues) {
      if (fv.signatureS3KeySnapshot) {
        try {
          const sigUrl = await esignStorageService.getPresignedUrl(fv.signatureS3KeySnapshot, 300);
          let sigBuffer: Buffer;
          if (sigUrl.startsWith('http')) {
            const resp = await fetch(sigUrl);
            sigBuffer = Buffer.from(await resp.arrayBuffer());
          } else {
            const fs = await import('fs');
            const path = await import('path');
            sigBuffer = fs.readFileSync(path.join(process.cwd(), sigUrl));
          }
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

    // Store signed PDF
    const signedPdfKey = esignStorageService.envelopeSignedKey(envelope._id.toString());
    await esignStorageService.putObject(signedPdfKey, signedPdfBuffer, 'application/pdf');

    // Update recipient status
    const activeRecipient = envelope.recipients.find(
      (r) => r.status === 'viewed' || r.status === 'sent'
    );
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

    envelope.auditTrail.push({
      eventType: 'finalised',
      timestamp: new Date(),
      metadata: { signedPdfSha256: signedPdfHash },
    });

    // Generate and store audit certificate
    const auditJson = pdfService.generateAuditCertificate(
      envelope.auditTrail as any[],
      envelope._id.toString(),
      signedPdfHash
    );
    const auditKey = esignStorageService.envelopeAuditKey(envelope._id.toString());
    await esignStorageService.putObject(auditKey, Buffer.from(auditJson), 'application/json');

    // Update envelope
    envelope.status = 'finalised';
    envelope.finalisedAt = new Date();
    envelope.signedPdfS3Key = signedPdfKey;
    envelope.signedPdfHashSha256 = signedPdfHash;
    envelope.auditTrailS3Key = auditKey;

    await envelope.save();

    // Send completion emails (async, don't block)
    this.sendCompletionEmails(envelope).catch((e) =>
      console.error('Failed to send completion emails:', e)
    );

    return envelope;
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
