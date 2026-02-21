import { Request, Response, NextFunction } from 'express';
import { PayrollRun } from './payrollRun.model';
import { PayrollEntry } from './payrollEntry.model';
import { calculatePayroll } from './payroll.service';
import { AppError } from '../../middlewares/errorHandler';
import { createAuditLog } from '../logs/log.service';

export const getPayrollRuns = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const runs = await PayrollRun.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: runs.map((run) => ({
        id: run._id.toString(),
        period_start: run.periodStart.toISOString(),
        period_end: run.periodEnd.toISOString(),
        status: run.status,
        total_gross: run.totalGross,
        total_net: run.totalNet,
        employee_count: run.employeeCount,
        created_at: run.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const getPayrollRunById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const run = await PayrollRun.findById(id).populate('createdBy', 'name email');

    if (!run) {
      throw new AppError(404, 'Payroll run not found');
    }

    res.json({
      success: true,
      data: {
        id: run._id.toString(),
        period_start: run.periodStart.toISOString(),
        period_end: run.periodEnd.toISOString(),
        status: run.status,
        total_gross: run.totalGross,
        total_net: run.totalNet,
        employee_count: run.employeeCount,
        created_at: run.createdAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createPayrollRun = async (
  req: Request,
  res: Response, next: NextFunction
) => {
  try {
    const { periodStart, periodEnd } = req.body;

    const run = new PayrollRun({
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      status: 'DRAFT',
      createdBy: req.user!.id,
    });
    await run.save();

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'CREATE',
      module: 'Payroll',
      resourceType: 'payroll_run',
      resourceId: run._id.toString(),
      ipAddress: req.ip || 'unknown',
    });

    res.status(201).json({
      success: true,
      data: run,
    });
  } catch (error) {
    next(error);
  }
};

export const calculatePayrollRun = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    await calculatePayroll(id);

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'UPDATE',
      module: 'Payroll',
      resourceType: 'payroll_run',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
    });

    res.json({
      success: true,
      message: 'Payroll calculated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const approvePayrollRun = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { type } = req.body; // 'hr' or 'finance'

    const run = await PayrollRun.findById(id);
    if (!run) {
      throw new AppError(404, 'Payroll run not found');
    }

    if (type === 'hr') {
      run.status = 'HR_APPROVED';
    } else if (type === 'finance') {
      run.status = 'FINANCE_APPROVED';
    }

    await run.save();

    res.json({
      success: true,
      data: run,
    });
  } catch (error) {
    next(error);
  }
};

export const finalizePayrollRun = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const run = await PayrollRun.findById(id);
    if (!run) {
      throw new AppError(404, 'Payroll run not found');
    }

    run.status = 'FINALIZED';
    await run.save();

    // TODO: Generate payslips and bank file

    res.json({
      success: true,
      message: 'Payroll finalized successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getPayrollEntries = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const entries = await PayrollEntry.find({ payrollRunId: id })
      .populate('employeeId', 'firstName lastName employeeCode departmentId');

    res.json({
      success: true,
      data: entries,
    });
  } catch (error) {
    next(error);
  }
};
