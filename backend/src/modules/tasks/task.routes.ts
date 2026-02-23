import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  getActiveTaskCount,
} from './task.controller';

export const taskRouter = Router();

taskRouter.use(authenticate);

taskRouter.get('/', getTasks);
taskRouter.get('/active-count', getActiveTaskCount);
taskRouter.get('/:id', getTaskById);
taskRouter.post('/', createTask);
taskRouter.patch('/:id', updateTask);
