import { Router } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth';
import {
  getScenarios,
  getScenario,
  createScenario,
  updateScenario,
  deleteScenario,
  activateScenarioStatus,
  freezeScenario,
  archiveScenario,
  getScenarioImpact,
  submitForApproval,
  startReview,
  approveScenario,
  rejectScenario,
  getPlanningInputs,
  getActivePlanningInput,
  getPlanningInput,
  createPlanningInput,
  updatePlanningInput,
  deletePlanningInput,
  activatePlanningInputStatus,
  getSummary,
} from './workforcePlanning.controller';

export const workforcePlanningRouter = Router();

// All routes require authentication
workforcePlanningRouter.use(authenticate);

// ────────────────────────────────────────────────────────────────────────────────
// SUMMARY
// ────────────────────────────────────────────────────────────────────────────────
workforcePlanningRouter.get('/summary', getSummary);

// ────────────────────────────────────────────────────────────────────────────────
// SCENARIOS
// ────────────────────────────────────────────────────────────────────────────────
workforcePlanningRouter.get('/scenarios', getScenarios);
workforcePlanningRouter.get('/scenarios/:id', getScenario);
workforcePlanningRouter.post('/scenarios', requireRole('ADMIN', 'HR_ADMIN', 'HRBP'), createScenario);
workforcePlanningRouter.patch('/scenarios/:id', requireRole('ADMIN', 'HR_ADMIN', 'HRBP'), updateScenario);
workforcePlanningRouter.delete('/scenarios/:id', requireRole('ADMIN', 'HR_ADMIN', 'HRBP'), deleteScenario);
workforcePlanningRouter.post('/scenarios/:id/activate', requireRole('ADMIN', 'HR_ADMIN'), activateScenarioStatus);
workforcePlanningRouter.post('/scenarios/:id/freeze', requireRole('ADMIN', 'HR_ADMIN', 'HRBP'), freezeScenario);
workforcePlanningRouter.post('/scenarios/:id/archive', requireRole('ADMIN', 'HR_ADMIN', 'HRBP'), archiveScenario);
workforcePlanningRouter.get('/scenarios/:id/impact', getScenarioImpact);

// Approval workflow endpoints
workforcePlanningRouter.post('/scenarios/:id/submit', requireRole('ADMIN', 'HR_ADMIN', 'HRBP'), submitForApproval);
workforcePlanningRouter.post('/scenarios/:id/review', requireRole('FINANCE', 'HR_ADMIN'), startReview);
workforcePlanningRouter.post('/scenarios/:id/approve', requireRole('FINANCE', 'HR_ADMIN'), approveScenario);
workforcePlanningRouter.post('/scenarios/:id/reject', requireRole('FINANCE', 'HR_ADMIN'), rejectScenario);

// ────────────────────────────────────────────────────────────────────────────────
// PLANNING INPUTS
// ────────────────────────────────────────────────────────────────────────────────
workforcePlanningRouter.get('/inputs', getPlanningInputs);
workforcePlanningRouter.get('/inputs/active', getActivePlanningInput);
workforcePlanningRouter.get('/inputs/:id', getPlanningInput);
workforcePlanningRouter.post('/inputs', requireRole('ADMIN', 'HR_ADMIN', 'HRBP'), createPlanningInput);
workforcePlanningRouter.patch('/inputs/:id', requireRole('ADMIN', 'HR_ADMIN', 'HRBP'), updatePlanningInput);
workforcePlanningRouter.delete('/inputs/:id', requireRole('ADMIN', 'HR_ADMIN', 'HRBP'), deletePlanningInput);
workforcePlanningRouter.post('/inputs/:id/activate', requireRole('ADMIN', 'HR_ADMIN', 'HRBP'), activatePlanningInputStatus);
