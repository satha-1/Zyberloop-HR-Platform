import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';

export const workforceRouter = Router();

workforceRouter.use(authenticate);
workforceRouter.get('/scenarios', (req, res) => {
  res.json({ success: true, data: [] });
});
