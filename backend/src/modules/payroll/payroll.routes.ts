import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import {
  getPayrollRuns,
  getPayrollRunById,
  createPayrollRun,
  calculatePayrollRun,
  approvePayrollRun,
  finalizePayrollRun,
  getPayrollEntries,
  getPayrollStats,
  updatePayrollRun,
  deletePayrollRun,
  lockPayrollRun,
  recalculatePayrollRun,
  previewPayrollRun,
  exportPayrollRun,
} from './payroll.controller';
import {
  getPayrollTemplates,
  getPayrollTemplateById,
  createPayrollTemplate,
  updatePayrollTemplate,
  deletePayrollTemplate,
  duplicatePayrollTemplate,
} from './payrollTemplate.controller';

export const payrollRouter = Router();

payrollRouter.use(authenticate);

// Payroll Templates Routes
payrollRouter.get('/templates', getPayrollTemplates);
payrollRouter.get('/templates/:id', getPayrollTemplateById);
payrollRouter.post('/templates', createPayrollTemplate);
payrollRouter.put('/templates/:id', updatePayrollTemplate);
payrollRouter.delete('/templates/:id', deletePayrollTemplate);
payrollRouter.post('/templates/:id/duplicate', duplicatePayrollTemplate);

// Payroll Runs Routes
payrollRouter.get('/runs', getPayrollRuns);
payrollRouter.get('/runs/:id', getPayrollRunById);
payrollRouter.post('/runs', createPayrollRun);
payrollRouter.put('/runs/:id', updatePayrollRun);
payrollRouter.delete('/runs/:id', deletePayrollRun);
payrollRouter.post('/runs/:id/lock', lockPayrollRun);
payrollRouter.post('/runs/:id/recalculate', recalculatePayrollRun);
payrollRouter.post('/runs/preview', previewPayrollRun);
payrollRouter.get('/runs/:id/export', exportPayrollRun);
payrollRouter.post('/runs/:id/calculate', calculatePayrollRun);
payrollRouter.post('/runs/:id/approve/hr', approvePayrollRun);
payrollRouter.post('/runs/:id/approve/finance', approvePayrollRun);
payrollRouter.post('/runs/:id/finalize', finalizePayrollRun);
payrollRouter.get('/runs/:id/entries', getPayrollEntries);

// Dashboard Stats
payrollRouter.get('/stats', getPayrollStats);
