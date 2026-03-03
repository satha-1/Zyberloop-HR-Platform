import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AppError } from '../../middlewares/errorHandler';
import { createAuditLog } from '../logs/log.service';
import { Employee } from './employee.model';
import { EmployeeBankAccount } from './employeeBankAccount.model';
import { EmployeeSalaryComponent } from '../payroll/employeeSalaryComponent.model';
import { SalaryComponent } from '../payroll/salaryComponent.model';

export const getEmployeeCompensationAssignments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employeeId } = req.params;
    const { asOf } = req.query;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      throw new AppError(400, 'Invalid employee ID');
    }

    const asOfDate = asOf ? new Date(String(asOf)) : new Date();
    const assignments = await EmployeeSalaryComponent.find({
      employeeId,
      isActive: true,
      effectiveFrom: { $lte: asOfDate },
      $or: [{ effectiveTo: { $exists: false } }, { effectiveTo: null }, { effectiveTo: { $gte: asOfDate } }],
    })
      .populate('salaryComponentId')
      .sort({ effectiveFrom: -1, createdAt: -1 });

    res.json({ success: true, data: assignments });
  } catch (error) {
    next(error);
  }
};

export const assignEmployeeSalaryComponent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employeeId } = req.params;
    const {
      salaryComponentId,
      effectiveFrom,
      effectiveTo,
      amount,
      rate,
      units,
      percentage,
      baseComponentCodes,
      notes,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      throw new AppError(400, 'Invalid employee ID');
    }
    if (!mongoose.Types.ObjectId.isValid(salaryComponentId)) {
      throw new AppError(400, 'Valid salaryComponentId is required');
    }
    if (!effectiveFrom) {
      throw new AppError(400, 'effectiveFrom is required');
    }

    const [employee, component] = await Promise.all([
      Employee.findById(employeeId).lean(),
      SalaryComponent.findById(salaryComponentId).lean(),
    ]);
    if (!employee) throw new AppError(404, 'Employee not found');
    if (!component) throw new AppError(404, 'Salary component not found');

    const assignment = await EmployeeSalaryComponent.create({
      employeeId,
      salaryComponentId,
      effectiveFrom: new Date(effectiveFrom),
      effectiveTo: effectiveTo ? new Date(effectiveTo) : undefined,
      amount,
      rate,
      units,
      percentage,
      baseComponentCodes,
      notes,
      createdBy: req.user?.id,
      updatedBy: req.user?.id,
      isActive: true,
    });

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'CREATE',
      module: 'Compensation',
      resourceType: 'employee_salary_component',
      resourceId: assignment._id.toString(),
      ipAddress: req.ip || 'unknown',
      diff: {
        employeeId,
        salaryComponentId,
      },
    });

    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
};

export const updateEmployeeSalaryComponent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assignmentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      throw new AppError(400, 'Invalid assignment ID');
    }

    const assignment = await EmployeeSalaryComponent.findById(assignmentId);
    if (!assignment) throw new AppError(404, 'Assignment not found');

    const before = assignment.toObject();
    const allowedFields = [
      'effectiveFrom',
      'effectiveTo',
      'amount',
      'rate',
      'units',
      'percentage',
      'baseComponentCodes',
      'notes',
      'isActive',
    ] as const;

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        (assignment as any)[field] =
          field === 'effectiveFrom' || field === 'effectiveTo'
            ? req.body[field]
              ? new Date(req.body[field])
              : undefined
            : req.body[field];
      }
    }
    assignment.updatedBy = new mongoose.Types.ObjectId(req.user!.id);
    await assignment.save();

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'UPDATE',
      module: 'Compensation',
      resourceType: 'employee_salary_component',
      resourceId: assignment._id.toString(),
      ipAddress: req.ip || 'unknown',
      diff: {
        before,
        after: assignment.toObject(),
      },
    });

    res.json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
};

export const getEmployeeBankAccounts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employeeId } = req.params;
    const { asOf } = req.query;
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      throw new AppError(400, 'Invalid employee ID');
    }

    const asOfDate = asOf ? new Date(String(asOf)) : new Date();
    const accounts = await EmployeeBankAccount.find({
      employeeId,
      isActive: true,
      effectiveFrom: { $lte: asOfDate },
      $or: [{ effectiveTo: { $exists: false } }, { effectiveTo: null }, { effectiveTo: { $gte: asOfDate } }],
    }).sort({ isPrimary: -1, effectiveFrom: -1, createdAt: -1 });

    res.json({ success: true, data: accounts });
  } catch (error) {
    next(error);
  }
};

export const createEmployeeBankAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employeeId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      throw new AppError(400, 'Invalid employee ID');
    }
    if (!req.body.bankName || !req.body.accountNumber || !req.body.accountHolderName || !req.body.effectiveFrom) {
      throw new AppError(400, 'bankName, accountNumber, accountHolderName, and effectiveFrom are required');
    }

    const account = await EmployeeBankAccount.create({
      employeeId,
      ...req.body,
      effectiveFrom: new Date(req.body.effectiveFrom),
      effectiveTo: req.body.effectiveTo ? new Date(req.body.effectiveTo) : undefined,
      createdBy: req.user?.id,
      updatedBy: req.user?.id,
    });

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'CREATE',
      module: 'Bank Details',
      resourceType: 'employee_bank_account',
      resourceId: account._id.toString(),
      ipAddress: req.ip || 'unknown',
      diff: { employeeId },
    });

    res.status(201).json({ success: true, data: account });
  } catch (error) {
    next(error);
  }
};

export const updateEmployeeBankAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bankAccountId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(bankAccountId)) {
      throw new AppError(400, 'Invalid bank account ID');
    }
    const account = await EmployeeBankAccount.findById(bankAccountId);
    if (!account) throw new AppError(404, 'Bank account not found');

    const before = account.toObject();
    const allowed = [
      'bankName',
      'branchName',
      'branchCode',
      'accountHolderName',
      'accountNumber',
      'accountType',
      'paymentMethod',
      'effectiveFrom',
      'effectiveTo',
      'isPrimary',
      'isActive',
    ] as const;
    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        (account as any)[field] =
          field === 'effectiveFrom' || field === 'effectiveTo'
            ? req.body[field]
              ? new Date(req.body[field])
              : undefined
            : req.body[field];
      }
    }
    account.updatedBy = new mongoose.Types.ObjectId(req.user!.id);
    await account.save();

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'UPDATE',
      module: 'Bank Details',
      resourceType: 'employee_bank_account',
      resourceId: account._id.toString(),
      ipAddress: req.ip || 'unknown',
      diff: {
        before,
        after: account.toObject(),
      },
    });

    res.json({ success: true, data: account });
  } catch (error) {
    next(error);
  }
};
