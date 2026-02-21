import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  submitForReview,
  approveTemplate,
  publishTemplate,
  deprecateTemplate,
} from './templates.controller';
import {
  previewDocument,
  generateDocument,
  getDocumentById,
  downloadDocument,
  getDocuments,
  bulkGenerateDocuments,
  getDocumentJob,
  requestSigning,
  handleSigningWebhook,
} from './documents.controller';

export const documentsRouter = Router();

documentsRouter.use(authenticate);

// Templates
documentsRouter.post('/templates', createTemplate);
documentsRouter.get('/templates', getTemplates);
documentsRouter.get('/templates/:id', getTemplateById);
documentsRouter.patch('/templates/:id', updateTemplate);
documentsRouter.post('/templates/:id/submit-review', submitForReview);
documentsRouter.post('/templates/:id/approve', approveTemplate);
documentsRouter.post('/templates/:id/publish', publishTemplate);
documentsRouter.post('/templates/:id/deprecate', deprecateTemplate);

// Documents
documentsRouter.post('/documents/preview', previewDocument);
documentsRouter.post('/documents', generateDocument);
documentsRouter.get('/documents', getDocuments);
documentsRouter.get('/documents/:id', getDocumentById);
documentsRouter.post('/documents/:id/download', downloadDocument);
documentsRouter.post('/documents/bulk', bulkGenerateDocuments);
documentsRouter.get('/document-jobs/:jobId', getDocumentJob);

// Signing
documentsRouter.post('/documents/:id/sign-request', requestSigning);
documentsRouter.post('/signing/webhook/:provider', handleSigningWebhook);
