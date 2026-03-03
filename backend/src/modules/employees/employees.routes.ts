import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { uploadEmployeeDocuments, uploadProfilePicture } from '../../middlewares/upload';
import {
  getEmployees,
  generateEmployeeCode,
  generateEmployeeNumberEndpoint,
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
import {
  getProfileSummary,
  getProfileJob,
  getProfileCompensation,
  getProfilePerformance,
  getProfileCareer,
  getProfileContact,
  getProfilePersonal,
  updateProfilePersonal,
  createProfileJobHistory,
  updateProfileJobHistory,
  deleteProfileJobHistory,
  getProfilePay,
  getProfileAbsence,
  getProfileBenefits,
  getProfileServiceDates,
  getProfileAssignedRoles,
  getProfileSupportRoles,
  getProfileExternalInteractions,
  getProfileAdditionalData,
  getProfileOrganizations,
  getProfileManagementChain,
} from './employeeProfile.controller';
import {
  getEmployeeCompensationAssignments,
  assignEmployeeSalaryComponent,
  updateEmployeeSalaryComponent,
  getEmployeeBankAccounts,
  createEmployeeBankAccount,
  updateEmployeeBankAccount,
} from './employeeCompensation.controller';

export const employeesRouter = Router();

employeesRouter.use(authenticate);

// Employee CRUD
employeesRouter.get('/generate-code', generateEmployeeCode);
employeesRouter.get('/generate-number', generateEmployeeNumberEndpoint);
employeesRouter.get('/', getEmployees);
employeesRouter.get('/:id', getEmployeeById);
employeesRouter.post('/', uploadEmployeeDocuments.array('documents', 10), createEmployee);
employeesRouter.patch('/:id', uploadProfilePicture.single('profilePicture'), updateEmployee);
employeesRouter.delete('/:id', deleteEmployee);

// Compensation module
employeesRouter.get('/:employeeId/compensation/components', getEmployeeCompensationAssignments);
employeesRouter.post('/:employeeId/compensation/components', assignEmployeeSalaryComponent);
employeesRouter.patch('/compensation/components/:assignmentId', updateEmployeeSalaryComponent);

// Bank details module (effective-dated)
employeesRouter.get('/:employeeId/bank-accounts', getEmployeeBankAccounts);
employeesRouter.post('/:employeeId/bank-accounts', createEmployeeBankAccount);
employeesRouter.patch('/bank-accounts/:bankAccountId', updateEmployeeBankAccount);

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

// Employee Profile 360° Endpoints
employeesRouter.get('/:employeeId/profile/summary', getProfileSummary);
employeesRouter.get('/:employeeId/profile/job', getProfileJob);
employeesRouter.get('/:employeeId/profile/compensation', getProfileCompensation);
employeesRouter.get('/:employeeId/profile/performance', getProfilePerformance);
employeesRouter.get('/:employeeId/profile/career', getProfileCareer);
employeesRouter.post('/:employeeId/profile/job-history', createProfileJobHistory);
employeesRouter.patch('/:employeeId/profile/job-history/:historyId', updateProfileJobHistory);
employeesRouter.delete('/:employeeId/profile/job-history/:historyId', deleteProfileJobHistory);
employeesRouter.get('/:employeeId/profile/contact', getProfileContact);
employeesRouter.get('/:employeeId/profile/personal', getProfilePersonal);
employeesRouter.patch('/:employeeId/profile/personal', updateProfilePersonal);
employeesRouter.get('/:employeeId/profile/pay', getProfilePay);
employeesRouter.get('/:employeeId/profile/absence', getProfileAbsence);
employeesRouter.get('/:employeeId/profile/benefits', getProfileBenefits);
employeesRouter.get('/:employeeId/profile/service-dates', getProfileServiceDates);
employeesRouter.get('/:employeeId/profile/assigned-roles', getProfileAssignedRoles);
employeesRouter.get('/:employeeId/profile/support-roles', getProfileSupportRoles);
employeesRouter.get('/:employeeId/profile/external-interactions', getProfileExternalInteractions);
employeesRouter.get('/:employeeId/profile/additional-data', getProfileAdditionalData);
employeesRouter.get('/:employeeId/profile/organizations', getProfileOrganizations);
employeesRouter.get('/:employeeId/profile/management-chain', getProfileManagementChain);