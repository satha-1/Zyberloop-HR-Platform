import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';

export const performanceRouter = Router();

performanceRouter.use(authenticate);
performanceRouter.get('/goals', (req, res) => {
  res.json({ success: true, data: [] });
});
performanceRouter.get('/appraisals', (req, res) => {
  res.json({ success: true, data: [] });
});
