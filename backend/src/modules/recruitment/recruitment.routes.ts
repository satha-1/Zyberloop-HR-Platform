import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import {
  getRequisitions,
  getRequisitionById,
  createRequisition,
  updateRequisitionStatus,
  getCandidates,
  getCandidateById,
  createCandidateApplication,
  updateCandidateApplicationStatus,
  getPublicRequisition,
} from './recruitment.controller';

export const recruitmentRouter = Router();

// Public route for candidate portal
recruitmentRouter.get('/public/requisitions/:id', getPublicRequisition);
recruitmentRouter.post('/public/applications', createCandidateApplication);

// Protected routes
recruitmentRouter.use(authenticate);
recruitmentRouter.get('/requisitions', getRequisitions);
recruitmentRouter.get('/requisitions/:id', getRequisitionById);
recruitmentRouter.post('/requisitions', createRequisition);
recruitmentRouter.patch('/requisitions/:id/status', updateRequisitionStatus);
recruitmentRouter.get('/candidates', getCandidates);
recruitmentRouter.get('/candidates/:id', getCandidateById);
recruitmentRouter.patch('/applications/:id/status', updateCandidateApplicationStatus);