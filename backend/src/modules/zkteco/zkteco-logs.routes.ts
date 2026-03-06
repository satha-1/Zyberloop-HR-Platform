import { Router } from 'express';
import { getZKTecoLogs } from './zkteco-logs.controller';
import { authenticate } from '../../middlewares/auth';

const router = Router();

/**
 * ZKTeco Logs API Routes
 * 
 * These routes provide access to ZKTeco device logs for debugging and monitoring
 */

// Get ZKTeco device logs with pagination and filters
router.get('/logs', authenticate, getZKTecoLogs);

export const zktecoLogsRouter = router;
