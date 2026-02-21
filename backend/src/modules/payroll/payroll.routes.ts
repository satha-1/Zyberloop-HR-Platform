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
} from './payroll.controller';

export const payrollRouter = Router();

payrollRouter.use(authenticate);
payrollRouter.get('/runs', getPayrollRuns);
payrollRouter.get('/runs/:id', getPayrollRunById);
payrollRouter.post('/runs', createPayrollRun);
payrollRouter.post('/runs/:id/calculate', calculatePayrollRun);
payrollRouter.post('/runs/:id/approve/hr', approvePayrollRun);
payrollRouter.post('/runs/:id/approve/finance', approvePayrollRun);
payrollRouter.post('/runs/:id/finalize', finalizePayrollRun);
payrollRouter.get('/runs/:id/entries', getPayrollEntries);
