import { Request, Response, NextFunction } from 'express';
import { esignService } from './services/esign.service';
import { esignStorageService } from './services/esignStorage.service';
import { createAuditLog } from '../logs/log.service';
import { AppError } from '../../middlewares/errorHandler';

// ─── SIGNATURE ASSETS ─────────────────────────────────────

export const createSignatureAsset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) throw new AppError(400, 'File is required');

    const asset = await esignService.createSignatureAsset({
      ownerUserId: req.user!.id,
      type: req.body.type || 'signature',
      method: req.body.method || 'uploaded',
      label: req.body.label,
      typedText: req.body.typedText,
      fontName: req.body.fontName,
      vectorData: req.body.vectorData,
      fileBuffer: req.file.buffer,
      mimeType: req.file.mimetype,
    });

    res.status(201).json({ success: true, data: asset });
  } catch (error) {
    next(error);
  }
};

export const getSignatureAssets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assets = await esignService.getSignatureAssets(
      req.user!.id,
      req.query.type as string | undefined
    );

    // Generate presigned URLs for each asset
    const assetsWithUrls = await Promise.all(
      assets.map(async (a) => {
        const url = await esignStorageService.getPresignedUrl(a.s3Key, 300);
        return { ...a.toObject(), imageUrl: url };
      })
    );

    res.json({ success: true, data: assetsWithUrls });
  } catch (error) {
    next(error);
  }
};

export const updateSignatureAsset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.body.isDefault) {
      await esignService.setSignatureAssetDefault(req.params.id, req.user!.id);
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const deleteSignatureAsset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await esignService.deleteSignatureAsset(req.params.id, req.user!.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// ─── PDF TEMPLATES ────────────────────────────────────────

export const createPdfTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) throw new AppError(400, 'PDF file is required');

    const { template, version } = await esignService.createTemplate({
      name: req.body.name || 'Untitled Template',
      description: req.body.description,
      createdByUserId: req.user!.id,
      pdfBuffer: req.file.buffer,
    });

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'ESIGN_TEMPLATE_CREATE',
      module: 'ESIGN',
      resourceType: 'pdf_template',
      resourceId: template._id.toString(),
      ipAddress: req.ip || 'unknown',
    });

    res.status(201).json({
      success: true,
      data: { template, version },
    });
  } catch (error) {
    next(error);
  }
};

export const getPdfTemplates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const templates = await esignService.getTemplates({
      status: req.query.status as string | undefined,
    });
    res.json({ success: true, data: templates });
  } catch (error) {
    next(error);
  }
};

export const getPdfTemplateById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const template = await esignService.getTemplateById(req.params.id);
    const versions = await esignService.getTemplateVersions(req.params.id);

    // Get presigned URL for source PDF of latest version
    let sourcePdfUrl: string | undefined;
    if (versions.length > 0) {
      sourcePdfUrl = await esignStorageService.getPresignedUrl(versions[0].sourcePdfS3Key, 300);
    }

    res.json({
      success: true,
      data: {
        ...template.toObject(),
        versions,
        sourcePdfUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createTemplateVersion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const version = await esignService.createNewVersion(req.params.id);
    res.status(201).json({ success: true, data: version });
  } catch (error) {
    next(error);
  }
};

export const updateTemplateVersion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const version = await esignService.updateVersionOverlay(
      req.params.versionId,
      req.body.overlayDefinition,
      req.body.name
    );

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'ESIGN_TEMPLATE_EDIT',
      module: 'ESIGN',
      resourceType: 'pdf_template_version',
      resourceId: req.params.versionId,
      ipAddress: req.ip || 'unknown',
    });

    res.json({ success: true, data: version });
  } catch (error) {
    next(error);
  }
};

export const publishTemplateVersion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const version = await esignService.publishVersion(req.params.versionId);

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'ESIGN_TEMPLATE_PUBLISH',
      module: 'ESIGN',
      resourceType: 'pdf_template_version',
      resourceId: req.params.versionId,
      ipAddress: req.ip || 'unknown',
    });

    res.json({ success: true, data: version });
  } catch (error) {
    next(error);
  }
};

export const duplicateTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { template, version } = await esignService.duplicateTemplate(req.params.id, req.user!.id);
    res.status(201).json({ success: true, data: { template, version } });
  } catch (error) {
    next(error);
  }
};

export const getTemplateVersion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const version = await esignService.getTemplateVersion(req.params.versionId);

    // Get presigned URL for source PDF
    const sourcePdfUrl = await esignStorageService.getPresignedUrl(version.sourcePdfS3Key, 300);

    res.json({
      success: true,
      data: {
        ...version.toObject(),
        sourcePdfUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── SIGN REQUEST ENVELOPES ──────────────────────────────

export const createEnvelope = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const envelope = await esignService.createEnvelope({
      ...req.body,
      createdByUserId: req.user!.id,
    });

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'ESIGN_ENVELOPE_CREATE',
      module: 'ESIGN',
      resourceType: 'sign_request_envelope',
      resourceId: envelope._id.toString(),
      ipAddress: req.ip || 'unknown',
    });

    res.status(201).json({ success: true, data: envelope });
  } catch (error) {
    next(error);
  }
};

export const sendEnvelope = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const envelope = await esignService.sendEnvelope(
      req.params.id,
      req.user!.name || req.user!.email || 'HR Admin',
      req.ip,
      req.headers['user-agent']
    );

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'ESIGN_ENVELOPE_SEND',
      module: 'ESIGN',
      resourceType: 'sign_request_envelope',
      resourceId: req.params.id,
      ipAddress: req.ip || 'unknown',
    });

    res.json({ success: true, data: envelope });
  } catch (error) {
    next(error);
  }
};

export const getEnvelopes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const envelopes = await esignService.getEnvelopes({
      status: req.query.status as string | undefined,
      employeeId: req.query.employeeId as string | undefined,
      templateId: req.query.templateId as string | undefined,
      dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
      dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
    });
    res.json({ success: true, data: envelopes });
  } catch (error) {
    next(error);
  }
};

export const getEnvelopeById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const envelope = await esignService.getEnvelopeById(req.params.id);

    // Get template version for overlay
    const version = await esignService.getTemplateVersion(envelope.templateVersionId.toString());
    const sourcePdfUrl = await esignStorageService.getPresignedUrl(version.sourcePdfS3Key, 300);

    res.json({
      success: true,
      data: {
        ...envelope.toObject(),
        templateVersion: version.toObject(),
        sourcePdfUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateEnvelope = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.body.displayName) {
      const envelope = await esignService.renameEnvelope(req.params.id, req.body.displayName);
      res.json({ success: true, data: envelope });
    } else {
      res.json({ success: true });
    }
  } catch (error) {
    next(error);
  }
};

export const voidEnvelope = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const envelope = await esignService.voidEnvelope(
      req.params.id,
      req.user!.id,
      req.ip,
      req.headers['user-agent']
    );

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'ESIGN_ENVELOPE_VOID',
      module: 'ESIGN',
      resourceType: 'sign_request_envelope',
      resourceId: req.params.id,
      ipAddress: req.ip || 'unknown',
    });

    res.json({ success: true, data: envelope });
  } catch (error) {
    next(error);
  }
};

export const downloadEnvelope = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const url = await esignService.getSignedPdfUrl(req.params.id);
    res.json({ success: true, data: { url } });
  } catch (error) {
    next(error);
  }
};

export const getEnvelopeAudit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const envelope = await esignService.getEnvelopeById(req.params.id);
    let auditUrl: string | undefined;
    let auditPdfUrl: string | undefined;
    if (envelope.auditTrailS3Key) {
      auditUrl = await esignStorageService.getPresignedUrl(envelope.auditTrailS3Key, 60);
    }
    if (envelope.auditTrailPdfS3Key) {
      auditPdfUrl = await esignStorageService.getPresignedUrl(envelope.auditTrailPdfS3Key, 60);
    }
    res.json({
      success: true,
      data: {
        auditTrail: envelope.auditTrail,
        auditFileUrl: auditUrl,
        auditPdfUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── SIGNING (Recipient side - public/token-based) ───────

export const getSigningSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const envelope = await esignService.validateSigningToken(req.params.token);
    const version = await esignService.getTemplateVersion(envelope.templateVersionId.toString());
    const sourcePdfUrl = await esignStorageService.getPresignedUrl(version.sourcePdfS3Key, 300);

    // Get existing field values
    const { SignRequestFieldValue } = await import('./signRequestFieldValue.model');
    const fieldValues = await SignRequestFieldValue.find({ envelopeId: envelope._id });

    res.json({
      success: true,
      data: {
        envelope: {
          _id: envelope._id,
          displayName: envelope.displayName,
          status: envelope.status,
          recipients: envelope.recipients,
          expiryAt: envelope.expiryAt,
        },
        templateVersion: {
          overlayDefinition: version.overlayDefinition,
          pageCount: version.pageCount,
          pageSizes: version.pageSizes,
        },
        sourcePdfUrl,
        fieldValues: fieldValues.map((fv) => ({
          fieldId: fv.fieldId,
          value: fv.value,
          signatureS3KeySnapshot: fv.signatureS3KeySnapshot,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const markSigningViewed = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const envelope = await esignService.markViewed(
      req.params.token,
      req.ip,
      req.headers['user-agent']
    );
    res.json({ success: true, data: { status: envelope.status } });
  } catch (error) {
    next(error);
  }
};

export const submitSigningField = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Handle signature image upload from multipart form or base64
    let signatureBuffer: Buffer | undefined;
    if (req.file) {
      signatureBuffer = req.file.buffer;
    } else if (req.body.signatureImageBase64) {
      const base64Data = req.body.signatureImageBase64.replace(/^data:image\/\w+;base64,/, '');
      signatureBuffer = Buffer.from(base64Data, 'base64');
    }

    const fieldValue = await esignService.submitFieldValue(
      req.params.token,
      req.body.fieldId,
      req.body.value,
      req.body.signatureAssetId,
      signatureBuffer,
      req.ip,
      req.headers['user-agent']
    );

    res.json({ success: true, data: fieldValue });
  } catch (error) {
    next(error);
  }
};

export const completeSigning = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const envelope = await esignService.completeSigning(
      req.params.token,
      req.ip,
      req.headers['user-agent']
    );

    let downloadUrl: string | undefined;
    if (envelope.signedPdfS3Key) {
      downloadUrl = await esignStorageService.getPresignedUrl(envelope.signedPdfS3Key, 300);
    }

    res.json({
      success: true,
      data: {
        status: envelope.status,
        downloadUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};
