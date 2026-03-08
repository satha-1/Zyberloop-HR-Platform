import { Router } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth';
import { upload } from '../../middlewares/upload';
import {
  getDashboard,
  getFilingTypes,
  createFilingType,
  updateFilingType,
  deleteFilingType,
  ensurePeriod,
  getFilings,
  getFiling,
  createFiling,
  updateFiling,
  generateFilingReport,
  uploadFilingReceipt,
  markFilingFiled,
  downloadAsset,
  recalculateFiling,
  getPermits,
  getPermit,
  createPermit,
  updatePermit,
  deletePermit,
  uploadPermitDoc,
  getAudits,
  getAudit,
  createAudit,
  updateAudit,
  deleteAudit,
  uploadAuditEvidence,
  generateComplianceReport,
  getAlerts,
  resolveAlert,
  snoozeAlert,
  getAutomations,
  createAutomation,
  updateAutomation,
  toggleAutomation,
  runAutomationNow,
} from './compliance.controller';

export const complianceRouter = Router();

// All routes require authentication
complianceRouter.use(authenticate);

// ============================================================================
// DASHBOARD
// ============================================================================
complianceRouter.get('/dashboard', getDashboard);

// ============================================================================
// FILING TYPES
// ============================================================================
complianceRouter.get('/filing-types', getFilingTypes);
complianceRouter.post('/filing-types', requireRole('ADMIN', 'HR_ADMIN'), createFilingType);
complianceRouter.patch('/filing-types/:id', requireRole('ADMIN', 'HR_ADMIN'), updateFilingType);
complianceRouter.delete('/filing-types/:id', requireRole('ADMIN', 'HR_ADMIN'), deleteFilingType);

// ============================================================================
// FILING PERIODS
// ============================================================================
complianceRouter.post('/periods/ensure', requireRole('ADMIN', 'HR_ADMIN', 'HRBP'), ensurePeriod);

// ============================================================================
// FILINGS
// ============================================================================
complianceRouter.get('/filings', getFilings);
complianceRouter.get('/filings/:id', getFiling);
complianceRouter.post('/filings', requireRole('ADMIN', 'HR_ADMIN', 'HRBP'), createFiling);
complianceRouter.patch('/filings/:id', requireRole('ADMIN', 'HR_ADMIN', 'HRBP'), updateFiling);
complianceRouter.post(
  '/filings/:id/generate-report',
  requireRole('ADMIN', 'HR_ADMIN', 'HRBP'),
  generateFilingReport
);
complianceRouter.post(
  '/filings/:id/upload-receipt',
  requireRole('ADMIN', 'HR_ADMIN', 'HRBP'),
  upload.single('file'),
  uploadFilingReceipt
);
complianceRouter.post('/filings/:id/mark-filed', requireRole('ADMIN', 'HR_ADMIN', 'HRBP'), markFilingFiled);
complianceRouter.post('/filings/:id/recalculate', requireRole('ADMIN', 'HR_ADMIN', 'HRBP'), recalculateFiling);

// ============================================================================
// ASSETS (Downloads)
// ============================================================================
complianceRouter.get('/assets/:assetId/download', downloadAsset);

// ============================================================================
// PERMITS
// ============================================================================
complianceRouter.get('/permits', getPermits);
complianceRouter.get('/permits/:id', getPermit);
complianceRouter.post('/permits', requireRole('ADMIN', 'HR_ADMIN', 'HRBP'), createPermit);
complianceRouter.patch('/permits/:id', requireRole('ADMIN', 'HR_ADMIN', 'HRBP'), updatePermit);
complianceRouter.delete('/permits/:id', requireRole('ADMIN', 'HR_ADMIN', 'HRBP'), deletePermit);
complianceRouter.post(
  '/permits/:id/upload-doc',
  requireRole('ADMIN', 'HR_ADMIN', 'HRBP'),
  upload.single('file'),
  uploadPermitDoc
);

// ============================================================================
// AUDIT REPORTS
// ============================================================================
complianceRouter.get('/audits', getAudits);
complianceRouter.get('/audits/:id', getAudit);
complianceRouter.post('/audits', requireRole('ADMIN', 'HR_ADMIN', 'HRBP'), createAudit);
complianceRouter.patch('/audits/:id', requireRole('ADMIN', 'HR_ADMIN', 'HRBP'), updateAudit);
complianceRouter.delete('/audits/:id', requireRole('ADMIN', 'HR_ADMIN', 'HRBP'), deleteAudit);
complianceRouter.post(
  '/audits/:id/upload-evidence',
  requireRole('ADMIN', 'HR_ADMIN', 'HRBP'),
  upload.single('file'),
  uploadAuditEvidence
);
complianceRouter.post(
  '/audits/generate-compliance-report',
  requireRole('ADMIN', 'HR_ADMIN', 'HRBP'),
  generateComplianceReport
);

// ============================================================================
// ALERTS
// ============================================================================
complianceRouter.get('/alerts', getAlerts);
complianceRouter.post('/alerts/:id/resolve', requireRole('ADMIN', 'HR_ADMIN', 'HRBP'), resolveAlert);
complianceRouter.post('/alerts/:id/snooze', requireRole('ADMIN', 'HR_ADMIN', 'HRBP'), snoozeAlert);

// ============================================================================
// AUTOMATION RULES
// ============================================================================
complianceRouter.get('/automations', getAutomations);
complianceRouter.post('/automations', requireRole('ADMIN', 'HR_ADMIN'), createAutomation);
complianceRouter.patch('/automations/:id', requireRole('ADMIN', 'HR_ADMIN'), updateAutomation);
complianceRouter.post('/automations/:id/toggle', requireRole('ADMIN', 'HR_ADMIN'), toggleAutomation);
complianceRouter.post('/automations/:id/run-now', requireRole('ADMIN', 'HR_ADMIN'), runAutomationNow);
