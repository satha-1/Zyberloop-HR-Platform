import { Router } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth';
import { getUsers, getUserById } from './users.controller';

export const usersRouter = Router();

usersRouter.use(authenticate);
usersRouter.get('/', requireRole('ADMIN', 'HR_ADMIN'), getUsers);
usersRouter.get('/:id', requireRole('ADMIN', 'HR_ADMIN'), getUserById);
