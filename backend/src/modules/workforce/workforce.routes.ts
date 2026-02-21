import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { getScenarios, createScenario, updateScenario, deleteScenario } from './workforce.controller';

export const workforceRouter = Router();

workforceRouter.use(authenticate);
workforceRouter.get('/scenarios', getScenarios);
workforceRouter.post('/scenarios', createScenario);
workforceRouter.patch('/scenarios/:id', updateScenario);
workforceRouter.delete('/scenarios/:id', deleteScenario);
