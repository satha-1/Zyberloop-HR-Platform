import { Request, Response, NextFunction } from 'express';
import { Employee } from './employee.model';
import { AppError } from '../../middlewares/errorHandler';
import { createAuditLog } from '../logs/log.service';

export const getEmployees = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { search, department, status } = req.query;

    const query: any = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { employeeCode: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (department) {
      query.departmentId = department;
    }

    if (status) {
      query.status = status;
    }

    const employees = await Employee.find(query)
      .populate('departmentId', 'name code')
      .populate('managerId', 'firstName lastName employeeCode')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: employees,
    });
  } catch (error) {
    next(error);
  }
};

export const getEmployeeById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id)
      .populate('departmentId', 'name code')
      .populate('managerId', 'firstName lastName employeeCode employeeCode');

    if (!employee) {
      throw new AppError(404, 'Employee not found');
    }

    res.json({
      success: true,
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

export const createEmployee = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const employee = new Employee(req.body);
    await employee.save();

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'CREATE',
      module: 'Employees',
      resourceType: 'employee',
      resourceId: employee._id.toString(),
      ipAddress: req.ip || 'unknown',
    });

    res.status(201).json({
      success: true,
      data: employee,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      throw new AppError(400, 'Employee code or email already exists');
    }
    next(error);
  }
};

export const updateEmployee = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!employee) {
      throw new AppError(404, 'Employee not found');
    }

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'UPDATE',
      module: 'Employees',
      resourceType: 'employee',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
    });

    res.json({
      success: true,
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};
