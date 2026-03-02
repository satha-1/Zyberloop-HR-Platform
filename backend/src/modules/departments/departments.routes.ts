import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { getDepartments, getDepartmentById, createDepartment, updateDepartment, deleteDepartment, generateCode } from './departments.controller';

export const departmentsRouter = Router();

departmentsRouter.use(authenticate);
departmentsRouter.get('/generate-code', generateCode);
departmentsRouter.get('/', getDepartments);
departmentsRouter.get('/:id', getDepartmentById);
departmentsRouter.post('/', createDepartment);
departmentsRouter.patch('/:id', updateDepartment);
departmentsRouter.delete('/:id', deleteDepartment);