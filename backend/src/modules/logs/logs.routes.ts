import { Router } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth';
import { getLogs, exportLogs } from './logs.controller';

export const logsRouter = Router();

logsRouter.use(authenticate);
logsRouter.use(requireRole('ADMIN', 'SYSTEM_ADMIN'));
logsRouter.get('/', getLogs);
logsRouter.post('/export', exportLogs);
