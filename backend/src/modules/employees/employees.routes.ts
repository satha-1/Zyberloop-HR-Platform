import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { uploadEmployeeDocuments, uploadProfilePicture } from '../../middlewares/upload';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeDocuments,
  uploadEmployeeDocument,
  downloadEmployeeDocument,
  deleteEmployeeDocument,
  generateDocument,
  getGeneratedDocuments,
  downloadGeneratedDocument,
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  previewDocument,
} from './employees.controller';

export const employeesRouter = Router();

employeesRouter.use(authenticate);

// Employee CRUD
employeesRouter.get('/', getEmployees);
employeesRouter.get('/:id', getEmployeeById);
employeesRouter.post('/', uploadEmployeeDocuments.array('documents', 10), createEmployee);
employeesRouter.patch('/:id', uploadProfilePicture.single('profilePicture'), updateEmployee);
employeesRouter.delete('/:id', deleteEmployee);

// Document Management
employeesRouter.get('/:id/documents', getEmployeeDocuments);
employeesRouter.post('/:id/documents', uploadEmployeeDocuments.single('document'), uploadEmployeeDocument);
employeesRouter.get('/documents/:docId/download', downloadEmployeeDocument);
employeesRouter.delete('/documents/:docId', deleteEmployeeDocument);

// Document Generation
employeesRouter.post('/documents/generate', generateDocument);
employeesRouter.post('/documents/preview', previewDocument);
employeesRouter.get('/:employeeId/documents/generated', getGeneratedDocuments);
employeesRouter.get('/documents/generated/:docId/download', downloadGeneratedDocument);

// Template Management
employeesRouter.get('/templates', getTemplates);
employeesRouter.get('/templates/:id', getTemplateById);
employeesRouter.post('/templates', createTemplate);
employeesRouter.patch('/templates/:id', updateTemplate);