import { Router } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth';
import { getUsers, getUserById, createUser, updateUser, deleteUser } from './users.controller';

export const usersRouter = Router();

usersRouter.use(authenticate);
usersRouter.get('/', requireRole('ADMIN', 'HR_ADMIN'), getUsers);
usersRouter.get('/:id', requireRole('ADMIN', 'HR_ADMIN'), getUserById);
usersRouter.post('/', requireRole('ADMIN', 'HR_ADMIN'), createUser);
usersRouter.patch('/:id', requireRole('ADMIN', 'HR_ADMIN'), updateUser);
usersRouter.delete('/:id', requireRole('ADMIN', 'HR_ADMIN'), deleteUser);