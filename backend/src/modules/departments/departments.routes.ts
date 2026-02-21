import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { getDepartments, getDepartmentById } from './departments.controller';

export const departmentsRouter = Router();

departmentsRouter.use(authenticate);
departmentsRouter.get('/', getDepartments);
departmentsRouter.get('/:id', getDepartmentById);
