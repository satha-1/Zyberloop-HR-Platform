import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../middlewares/auth';
import {
  // Signature assets
  createSignatureAsset,
  getSignatureAssets,
  updateSignatureAsset,
  deleteSignatureAsset,
  // PDF Templates
  createPdfTemplate,
  getPdfTemplates,
  getPdfTemplateById,
  createTemplateVersion,
  updateTemplateVersion,
  publishTemplateVersion,
  duplicateTemplate,
  getTemplateVersion,
  // Envelopes
  createEnvelope,
  sendEnvelope,
  getEnvelopes,
  getEnvelopeById,
  updateEnvelope,
  voidEnvelope,
  downloadEnvelope,
  getEnvelopeAudit,
  // Signing (recipient side)
  getSigningSession,
  markSigningViewed,
  submitSigningField,
  completeSigning,
} from './esign.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/svg+xml',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PDF, PNG, JPG, SVG'));
    }
  },
});

export const esignRouter = Router();

// ─── Authenticated routes ─────────────────────────────────

// Signature Assets
esignRouter.post('/signature-assets', authenticate, upload.single('file'), createSignatureAsset);
esignRouter.get('/signature-assets', authenticate, getSignatureAssets);
esignRouter.patch('/signature-assets/:id', authenticate, updateSignatureAsset);
esignRouter.delete('/signature-assets/:id', authenticate, deleteSignatureAsset);

// PDF Templates
esignRouter.post('/templates', authenticate, upload.single('file'), createPdfTemplate);
esignRouter.get('/templates', authenticate, getPdfTemplates);
esignRouter.get('/templates/:id', authenticate, getPdfTemplateById);
esignRouter.post('/templates/:id/versions', authenticate, createTemplateVersion);
esignRouter.get('/templates/:id/versions/:versionId', authenticate, getTemplateVersion);
esignRouter.put('/templates/:id/versions/:versionId', authenticate, updateTemplateVersion);
esignRouter.post('/templates/:id/versions/:versionId/publish', authenticate, publishTemplateVersion);
esignRouter.post('/templates/:id/duplicate', authenticate, duplicateTemplate);

// Sign Request Envelopes
esignRouter.post('/envelopes', authenticate, createEnvelope);
esignRouter.post('/envelopes/:id/send', authenticate, sendEnvelope);
esignRouter.get('/envelopes', authenticate, getEnvelopes);
esignRouter.get('/envelopes/:id', authenticate, getEnvelopeById);
esignRouter.patch('/envelopes/:id', authenticate, updateEnvelope);
esignRouter.post('/envelopes/:id/void', authenticate, voidEnvelope);
esignRouter.get('/envelopes/:id/download', authenticate, downloadEnvelope);
esignRouter.get('/envelopes/:id/audit', authenticate, getEnvelopeAudit);

// ─── Public signing routes (token-based, no JWT auth) ─────

esignRouter.get('/sign/:token', getSigningSession);
esignRouter.post('/sign/:token/viewed', markSigningViewed);
esignRouter.post('/sign/:token/field', upload.single('signatureImage'), submitSigningField);
esignRouter.post('/sign/:token/complete', completeSigning);
