import { Request, Response, NextFunction } from 'express';
import { Department } from './department.model';
import { AppError } from '../../middlewares/errorHandler';
import { createAuditLog } from '../logs/log.service';

export const getDepartments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const departments = await Department.find()
      .populate('headId', 'firstName lastName employeeCode')
      .populate('parentDepartmentId', 'name code')
      .sort({ name: 1 });
    res.json({
      success: true,
      data: departments,
    });
  } catch (error) {
    next(error);
  }
};

export const getDepartmentById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const department = await Department.findById(id)
      .populate('headId', 'firstName lastName employeeCode')
      .populate('parentDepartmentId', 'name code');

    if (!department) {
      throw new AppError(404, 'Department not found');
    }

    res.json({
      success: true,
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

export const createDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, code, parentDepartmentId, headId } = req.body;

    if (!name || !code) {
      throw new AppError(400, 'Name and code are required');
    }

    const department = new Department({
      name,
      code: code.toUpperCase(),
      parentDepartmentId,
      headId,
    });

    await department.save();

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'CREATE',
      module: 'Departments',
      resourceType: 'department',
      resourceId: department._id.toString(),
      ipAddress: req.ip || 'unknown',
    });

    res.status(201).json({
      success: true,
      data: department,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      throw new AppError(400, 'Department code already exists');
    }
    next(error);
  }
};

export const updateDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
    }

    const department = await Department.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!department) {
      throw new AppError(404, 'Department not found');
    }

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'UPDATE',
      module: 'Departments',
      resourceType: 'department',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
    });

    res.json({
      success: true,
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const department = await Department.findByIdAndDelete(id);

    if (!department) {
      throw new AppError(404, 'Department not found');
    }

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'DELETE',
      module: 'Departments',
      resourceType: 'department',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
    });

    res.json({
      success: true,
      message: 'Department deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
