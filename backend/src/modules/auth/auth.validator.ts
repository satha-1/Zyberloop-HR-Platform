import { body, ValidationChain } from 'express-validator';

export const validateLogin: ValidationChain[] = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];
