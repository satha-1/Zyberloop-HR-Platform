import { Router } from 'express';
import { getZKTecoLogs, getZKTecoLogsStats } from './zkteco-logs.controller';
import { authenticate } from '../../middlewares/auth';

const router = Router();

/**
 * ZKTeco Logs API Routes
 * 
 * These routes provide access to ZKTeco device logs for debugging and monitoring
 */

// Get ZKTeco device logs with pagination and filters
router.get('/logs', authenticate, getZKTecoLogs);

// Get statistics about ZKTeco logs
router.get('/logs/stats', authenticate, getZKTecoLogsStats);

export const zktecoLogsRouter = router;
