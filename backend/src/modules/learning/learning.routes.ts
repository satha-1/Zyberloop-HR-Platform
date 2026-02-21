import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';

export const learningRouter = Router();

learningRouter.use(authenticate);
learningRouter.get('/courses', (req, res) => {
  res.json({ success: true, data: [] });
});
