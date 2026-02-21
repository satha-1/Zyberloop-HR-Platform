import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { getFilings, createFiling, updateFiling, deleteFiling } from './compliance.controller';

export const complianceRouter = Router();

complianceRouter.use(authenticate);
complianceRouter.get('/filings', getFilings);
complianceRouter.post('/filings', createFiling);
complianceRouter.patch('/filings/:id', updateFiling);
complianceRouter.delete('/filings/:id', deleteFiling);
