import { Request, Response, NextFunction } from 'express';
import { calculatePayslip, calculatePayslipFromJSON } from './payslipCalculator.service';
import { AppError } from '../../middlewares/errorHandler';

/**
 * POST /api/v1/payroll/calculate-payslip
 * Calculate payslip from structured input
 */
export const calculatePayslipEndpoint = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const input = req.body;

    // Validate required fields
    if (!input.employee || !input.pay_period || !input.salary_structure) {
      throw new AppError(400, 'Missing required fields: employee, pay_period, salary_structure');
    }

    if (!input.employee.id || !input.employee.name) {
      throw new AppError(400, 'Employee id and name are required');
    }

    if (!input.pay_period.month || !input.pay_period.year || !input.pay_period.start_date || !input.pay_period.end_date) {
      throw new AppError(400, 'Pay period month, year, start_date, and end_date are required');
    }

    if (input.salary_structure.basic === undefined || input.salary_structure.basic === null) {
      throw new AppError(400, 'Basic salary is required');
    }

    const result = calculatePayslip(input);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/payroll/calculate-payslip-from-json
 * Calculate payslip from JSON string input
 */
export const calculatePayslipFromJSONEndpoint = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { json_input } = req.body;

    if (!json_input || typeof json_input !== 'string') {
      throw new AppError(400, 'json_input (string) is required');
    }

    const result = calculatePayslipFromJSON(json_input);

    res.json(result);
  } catch (error) {
    next(error);
  }
};
