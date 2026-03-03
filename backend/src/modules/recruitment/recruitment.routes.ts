import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { uploadCandidateResume } from '../../middlewares/upload';
import {
  getRequisitions,
  getRequisitionById,
  createRequisition,
  updateRequisition,
  updateRequisitionStatus,
  getCandidates,
  getCandidateById,
  createCandidateApplication,
  updateCandidateApplicationStatus,
  getPublicRequisition,
  checkApplicationStatus,
  getHiringManagers,
  getLocations,
  getRequisitionCandidates,
  generateBudgetCodeEndpoint,
  getPendingApprovals,
  approveRequisition,
  publishRequisition,
} from './recruitment.controller';

export const recruitmentRouter = Router();

// Public route for candidate portal
recruitmentRouter.get('/public/requisitions/:id', getPublicRequisition);
recruitmentRouter.get('/public/check-application', checkApplicationStatus);
recruitmentRouter.post('/public/applications', uploadCandidateResume.single('resume'), createCandidateApplication);

// Protected routes
recruitmentRouter.use(authenticate);
recruitmentRouter.get('/generate-budget-code', generateBudgetCodeEndpoint);
recruitmentRouter.get('/requisitions', getRequisitions);
recruitmentRouter.get('/requisitions/:id', getRequisitionById);
recruitmentRouter.post('/requisitions', createRequisition);
recruitmentRouter.patch('/requisitions/:id', updateRequisition);
recruitmentRouter.patch('/requisitions/:id/status', updateRequisitionStatus);
recruitmentRouter.get('/approvals/pending', getPendingApprovals);
recruitmentRouter.post('/requisitions/:id/approve', approveRequisition);
recruitmentRouter.post('/requisitions/:id/publish', publishRequisition);
recruitmentRouter.get('/candidates', getCandidates);
recruitmentRouter.get('/candidates/:id', getCandidateById);
recruitmentRouter.patch('/applications/:id/status', updateCandidateApplicationStatus);
recruitmentRouter.get('/hiring-managers', getHiringManagers);
recruitmentRouter.get('/locations', getLocations);
recruitmentRouter.get('/requisitions/:id/candidates', getRequisitionCandidates);