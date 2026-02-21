import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import {
  getPerformanceCycles,
  createPerformanceCycle,
  getGoals,
  createGoal,
  updateGoal,
  getAppraisals,
  createAppraisal,
  updateAppraisal,
} from './performance.controller';

export const performanceRouter = Router();

performanceRouter.use(authenticate);

// Performance Cycles
performanceRouter.get('/cycles', getPerformanceCycles);
performanceRouter.post('/cycles', createPerformanceCycle);

// Goals
performanceRouter.get('/goals', getGoals);
performanceRouter.post('/goals', createGoal);
performanceRouter.patch('/goals/:id', updateGoal);

// Appraisals
performanceRouter.get('/appraisals', getAppraisals);
performanceRouter.post('/appraisals', createAppraisal);
performanceRouter.patch('/appraisals/:id', updateAppraisal);
