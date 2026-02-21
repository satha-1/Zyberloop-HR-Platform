import { Router } from 'express';
import { login } from './auth.controller';
import { validateLogin } from './auth.validator';
import { validate } from '../../middlewares/validator';

export const authRouter = Router();

authRouter.post('/login', validateLogin, validate, login);
