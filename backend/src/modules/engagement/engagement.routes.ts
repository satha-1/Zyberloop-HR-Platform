import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import {
  getSurveys,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  getSurveyResponses,
  submitSurveyResponse,
} from './engagement.controller';

export const engagementRouter = Router();

engagementRouter.use(authenticate);
engagementRouter.get('/surveys', getSurveys);
engagementRouter.post('/surveys', createSurvey);
engagementRouter.patch('/surveys/:id', updateSurvey);
engagementRouter.delete('/surveys/:id', deleteSurvey);
engagementRouter.get('/responses', getSurveyResponses);
engagementRouter.post('/responses', submitSurveyResponse);
