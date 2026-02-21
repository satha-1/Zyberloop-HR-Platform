import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';

export const attendanceRouter = Router();

attendanceRouter.use(authenticate);
attendanceRouter.get('/', (req, res) => {
  res.json({ success: true, data: [] });
});
