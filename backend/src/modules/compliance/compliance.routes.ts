import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';

export const complianceRouter = Router();

complianceRouter.use(authenticate);
complianceRouter.get('/filings', (req, res) => {
  res.json({ success: true, data: [] });
});
