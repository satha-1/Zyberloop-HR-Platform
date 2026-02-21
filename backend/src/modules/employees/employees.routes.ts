import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
} from './employees.controller';

export const employeesRouter = Router();

employeesRouter.use(authenticate);
employeesRouter.get('/', getEmployees);
employeesRouter.get('/:id', getEmployeeById);
employeesRouter.post('/', createEmployee);
employeesRouter.patch('/:id', updateEmployee);
