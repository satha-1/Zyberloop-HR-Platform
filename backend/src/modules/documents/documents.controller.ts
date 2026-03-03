import { Request, Response, NextFunction } from 'express';
import { templateService } from './services/template.service';
import { mergeContextResolver } from './services/mergeContextResolver.service';
import { documentRenderService } from './services/documentRender.service';
import { documentService } from './services/document.service';
import { signingService } from './services/signing.service';
import { DocumentJob } from './documentJob.model';
import { createAuditLog } from '../logs/log.service';
import { AppError } from '../../middlewares/errorHandler';
import mongoose from 'mongoose';
import crypto from 'crypto';

// Lazy load BullMQ to avoid errors if Redis is not available
let documentQueue: any = null;
let bulkDocumentQueue: any = null;

async function getQueues() {
  if (!documentQueue) {
    try {
      const { Queue } = await import('bullmq');
      const Redis = (await import('ioredis')).default;
      const { config } = await import('../../config');
      
      const connection = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        maxRetriesPerRequest: null,
        retryStrategy: () => null, // Don't retry if connection fails
      });

      documentQueue = new Queue('document:generate', { connection: connection as any });
      bulkDocumentQueue = new Queue('document:bulkGenerate', { connection: connection as any });
    } catch (error) {
      console.warn('BullMQ/Redis not available, document generation will be synchronous:', error);
    }
  }
  return { documentQueue, bulkDocumentQueue };
}

export const previewDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { templateId, locale, docType, subjectType, subjectId, effectiveOn, inputsRef } = req.body;

    // Resolve template
    let template;
    if (templateId) {
      template = await templateService.getTemplateById(templateId);
    } else if (docType && locale) {
      template = await templateService.resolveTemplateVersion(
        docType,
        locale,
        effectiveOn ? new Date(effectiveOn) : undefined
      );
    }

    if (!template) {
      throw new AppError(404, 'Template not found');
    }

    // Resolve context
    const { context } = await mergeContextResolver.resolveContext(
      template.docType,
      subjectType,
      subjectId,
      effectiveOn ? new Date(effectiveOn) : undefined
    );

    // Generate preview
    const { html, pdfBuffer } = await documentRenderService.generatePreview(template, context, true);

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'DOCUMENT_PREVIEW',
      module: 'DOCUMENTS',
      resourceType: 'document',
      resourceId: 'preview',
      ipAddress: req.ip || 'unknown',
    });

    res.json({
      success: true,
      data: {
        html,
        pdfPreviewPresignedUrl: pdfBuffer ? 'data:application/pdf;base64,' + pdfBuffer.toString('base64') : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const generateDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { docType, templateId, subjectType, subjectId, effectiveOn, inputsRef, delivery } = req.body;

    // Resolve template
    let template;
    if (templateId) {
      template = await templateService.getTemplateById(templateId);
    } else {
      template = await templateService.resolveTemplateVersion(
        docType,
        req.body.locale || 'en',
        effectiveOn ? new Date(effectiveOn) : undefined
      );
    }

    if (!template) {
      throw new AppError(404, 'Template not found');
    }

    // Resolve context
    const { context, contextHash } = await mergeContextResolver.resolveContext(
      template.docType,
      subjectType,
      subjectId,
      effectiveOn ? new Date(effectiveOn) : undefined
    );

    // Create document record
    const doc = await documentService.createDocument({
      docType: template.docType,
      templateId: template._id,
      templateVersion: template.version,
      subjectType,
      subjectId,
      renderInputSnapshot: {
        sha256: contextHash,
        redactedPreview: { subjectType, subjectId },
      },
      artefacts: [],
      createdBy: new mongoose.Types.ObjectId(req.user!.id),
    });

    // Queue generation job or generate synchronously
    const queues = await getQueues();
    if (queues.documentQueue) {
      await queues.documentQueue.add('generate', {
        documentId: doc._id.toString(),
        templateId: template._id.toString(),
        subjectType,
        subjectId,
        effectiveOn,
        tenantId: undefined,
      });
    } else {
      // Fallback: generate synchronously
      try {
        const { pdfBuffer, pdfHash, objectKey } = await documentRenderService.generateDocument(
          template,
          context,
          contextHash,
          doc._id.toString(),
          undefined
        );
        await documentService.addArtefact(doc._id.toString(), {
          kind: 'PDF_MASTER',
          objectKey,
          contentType: 'application/pdf',
          sha256: pdfHash,
          sizeBytes: pdfBuffer.length,
        });
      } catch (error: any) {
        console.error('Synchronous document generation failed:', error);
      }
    }

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'DOCUMENT_GENERATE',
      module: 'DOCUMENTS',
      resourceType: 'document',
      resourceId: doc._id.toString(),
      ipAddress: req.ip || 'unknown',
    });

    res.status(201).json({
      success: true,
      data: {
        documentId: doc._id.toString(),
        jobId: 'queued',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getDocumentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doc = await documentService.getDocumentById(req.params.id, {
      id: req.user!.id,
      roles: req.user!.roles || [],
      subjectId: req.user!.id, // TODO: Get employee ID if user is employee
    });

    res.json({ success: true, data: doc });
  } catch (error) {
    next(error);
  }
};

export const downloadDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { artefactKind } = req.body;

    const { url, expiresAt } = await documentService.createDownloadLink(
      req.params.id,
      artefactKind,
      {
        id: req.user!.id,
        roles: req.user!.roles || [],
        subjectId: req.user!.id,
      }
    );

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'DOCUMENT_DOWNLOAD',
      module: 'DOCUMENTS',
      resourceType: 'document',
      resourceId: req.params.id,
      ipAddress: req.ip || 'unknown',
    });

    res.json({ success: true, data: { url, expiresAt } });
  } catch (error) {
    next(error);
  }
};

export const getDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const documents = await documentService.getDocuments({
      docType: req.query.docType as string,
      status: req.query.status as any,
      subjectType: req.query.subjectType as string,
      subjectId: req.query.subjectId as string,
      dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
      dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
    });

    res.json({ success: true, data: documents });
  } catch (error) {
    next(error);
  }
};

export const bulkGenerateDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { docType, payrollRunId } = req.body;

    // Create document job record
    const documentJob = new DocumentJob({
      jobType: 'BULK_GENERATE',
      docType,
      inputsRef: {
        payrollRunId,
        createdBy: new mongoose.Types.ObjectId(req.user!.id),
      },
      status: 'QUEUED',
      progress: { total: 0, succeeded: 0, failed: 0 },
    });
    await documentJob.save();

    // Resolve template
    const template = await templateService.resolveTemplateVersion(docType, 'en');
    if (!template) {
      throw new AppError(404, 'Template not found');
    }

    // Queue bulk generation job or process synchronously
    const queues = await getQueues();
    if (queues.bulkDocumentQueue) {
      await queues.bulkDocumentQueue.add('bulkGenerate', {
        jobId: documentJob._id.toString(),
        payrollRunId,
        docType,
        templateId: template._id.toString(),
        templateVersion: template.version,
        tenantId: undefined,
      });
    } else {
      // Fallback: mark as failed if no queue available
      documentJob.status = 'FAILED';
      documentJob.errorMessage = 'Redis/BullMQ not available for bulk generation';
      documentJob.finishedAt = new Date();
      await documentJob.save();
    }

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'DOCUMENT_BULK_GENERATE',
      module: 'DOCUMENTS',
      resourceType: 'document_job',
      resourceId: documentJob._id.toString(),
      ipAddress: req.ip || 'unknown',
    });

    res.status(201).json({
      success: true,
      data: {
        jobId: documentJob._id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getDocumentJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await DocumentJob.findById(req.params.jobId);
    if (!job) {
      throw new AppError(404, 'Job not found');
    }

    res.json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
};

export const requestSigning = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { provider, signers, redirectUrls } = req.body;

    const result = await signingService.createSignRequest(
      req.params.id,
      provider,
      signers
    );

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'DOCUMENT_SIGN_REQUEST_SENT',
      module: 'DOCUMENTS',
      resourceType: 'document',
      resourceId: req.params.id,
      ipAddress: req.ip || 'unknown',
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const handleSigningWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { provider } = req.params;
    await signingService.handleWebhook(provider as any, req.body);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
