import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';

export const engagementRouter = Router();

engagementRouter.use(authenticate);
engagementRouter.get('/surveys', (req, res) => {
  res.json({ success: true, data: [] });
});
