import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import {
  getAttendanceRecords,
  createAttendanceRecord,
  updateAttendanceRecord,
  deleteAttendanceRecord,
} from './attendance.controller';

export const attendanceRouter = Router();

attendanceRouter.use(authenticate);
attendanceRouter.get('/', getAttendanceRecords);
attendanceRouter.post('/', createAttendanceRecord);
attendanceRouter.patch('/:id', updateAttendanceRecord);
attendanceRouter.delete('/:id', deleteAttendanceRecord);
