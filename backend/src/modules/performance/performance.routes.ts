import { Router } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth';
import {
  listCycles, getCycle, createCycle, updateCycle,
  listGoals, createGoal, updateGoal, deleteGoal, updateGoalProgress, cascadeGoals, acceptSuggestion, rejectSuggestion,
  getRatingFormula, upsertRatingFormula,
  getMeritMatrix, upsertMeritMatrix,
  generateAppraisals, listAppraisals, getAppraisal, updateAppraisal, submitByManager, submitByEmployee, approveAppraisal,
  list360Templates, get360Template, create360Template, update360Template, delete360Template, duplicate360Template,
  generate360Assignments, list360Assignments, get360Assignment, update360Assignment,
  send360Invites, get360FormByToken, mark360Opened, submit360Response, get360Aggregate, sync360ToAppraisals,
  getBiasSummary, getBiasFlags, runBias, updateBiasFlag,
} from './performance.controller';

export const performanceRouter = Router();

// Public token-based 360 endpoints (no auth)
performanceRouter.get('/360/respond/:token', get360FormByToken);
performanceRouter.post('/360/respond/:token/opened', mark360Opened);
performanceRouter.post('/360/respond/:token/submit', submit360Response);

// All other routes require authentication
performanceRouter.use(authenticate);

// â”€â”€â”€ Cycles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
performanceRouter.get('/cycles', listCycles);
performanceRouter.post('/cycles', requireRole('ADMIN', 'HR_ADMIN', 'HRBP'), createCycle);
performanceRouter.get('/cycles/:id', getCycle);
performanceRouter.patch('/cycles/:id', requireRole('ADMIN', 'HR_ADMIN', 'HRBP'), updateCycle);

// â”€â”€â”€ Goals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
performanceRouter.get('/cycles/:cycleId/goals', listGoals);
performanceRouter.post('/cycles/:cycleId/goals', createGoal);
performanceRouter.post('/cycles/:cycleId/goals/cascade', requireRole('ADMIN', 'HR_ADMIN', 'HRBP', 'MANAGER'), cascadeGoals);
performanceRouter.patch('/goals/:id', updateGoal);
performanceRouter.delete('/goals/:id', requireRole('ADMIN', 'HR_ADMIN', 'HRBP', 'MANAGER'), deleteGoal);
performanceRouter.post('/goals/:id/progress', updateGoalProgress);
performanceRouter.post('/goals/:id/accept-suggestion', acceptSuggestion);
performanceRouter.post('/goals/:id/reject-suggestion', rejectSuggestion);

// â”€â”€â”€ Rating formula â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
performanceRouter.get('/cycles/:cycleId/rating-formula', getRatingFormula);
performanceRouter.put('/cycles/:cycleId/rating-formula', requireRole('ADMIN', 'HR_ADMIN'), upsertRatingFormula);

// â”€â”€â”€ Merit matrix â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
performanceRouter.get('/cycles/:cycleId/merit-matrix', getMeritMatrix);
performanceRouter.put('/cycles/:cycleId/merit-matrix', requireRole('ADMIN', 'HR_ADMIN'), upsertMeritMatrix);

// â”€â”€â”€ Appraisals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
performanceRouter.post('/cycles/:cycleId/appraisals/generate', requireRole('ADMIN', 'HR_ADMIN', 'HRBP'), generateAppraisals);
performanceRouter.get('/cycles/:cycleId/appraisals', requireRole('ADMIN', 'HR_ADMIN', 'HRBP', 'MANAGER'), listAppraisals);
performanceRouter.get('/appraisals/:id', getAppraisal);
performanceRouter.patch('/appraisals/:id', updateAppraisal);
performanceRouter.post('/appraisals/:id/submit-manager', requireRole('ADMIN', 'HR_ADMIN', 'MANAGER'), submitByManager);
performanceRouter.post('/appraisals/:id/submit-employee', submitByEmployee);
performanceRouter.post('/appraisals/:id/approve', requireRole('ADMIN', 'HR_ADMIN', 'HRBP'), approveAppraisal);

// â”€â”€â”€ 360 Feedback â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
performanceRouter.get('/cycles/:cycleId/360/templates', list360Templates);
performanceRouter.post('/cycles/:cycleId/360/templates', requireRole('ADMIN', 'HR_ADMIN', 'HRBP'), create360Template);
performanceRouter.get('/360/templates/:id', get360Template);
performanceRouter.patch('/360/templates/:id', requireRole('ADMIN', 'HR_ADMIN', 'HRBP'), update360Template);
performanceRouter.delete('/360/templates/:id', requireRole('ADMIN', 'HR_ADMIN', 'HRBP'), delete360Template);
performanceRouter.post('/360/templates/:id/duplicate', requireRole('ADMIN', 'HR_ADMIN', 'HRBP'), duplicate360Template);
performanceRouter.post('/cycles/:cycleId/360/assignments/generate', requireRole('ADMIN', 'HR_ADMIN', 'HRBP'), generate360Assignments);
performanceRouter.get('/cycles/:cycleId/360/assignments', list360Assignments);
performanceRouter.get('/360/assignments/:id', get360Assignment);
performanceRouter.patch('/360/assignments/:id', requireRole('ADMIN', 'HR_ADMIN', 'HRBP', 'MANAGER'), update360Assignment);
performanceRouter.post('/360/assignments/:id/send', requireRole('ADMIN', 'HR_ADMIN', 'HRBP'), send360Invites);
performanceRouter.get('/360/assignments/:id/aggregate', get360Aggregate);
performanceRouter.post('/cycles/:cycleId/360/sync-to-appraisals', requireRole('ADMIN', 'HR_ADMIN', 'HRBP'), sync360ToAppraisals);

// â”€â”€â”€ Bias Detection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
performanceRouter.get('/cycles/:cycleId/bias/summary', requireRole('ADMIN', 'HR_ADMIN', 'HRBP'), getBiasSummary);
performanceRouter.get('/cycles/:cycleId/bias/flags', requireRole('ADMIN', 'HR_ADMIN', 'HRBP'), getBiasFlags);
performanceRouter.post('/cycles/:cycleId/bias/run', requireRole('ADMIN', 'HR_ADMIN', 'HRBP'), runBias);
performanceRouter.patch('/bias/flags/:id', requireRole('ADMIN', 'HR_ADMIN', 'HRBP'), updateBiasFlag);
