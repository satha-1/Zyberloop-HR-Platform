import { Request, Response, NextFunction } from 'express';
import { Department } from './department.model';
import { AppError } from '../../middlewares/errorHandler';

export const getDepartments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
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
    const department = await Department.findById(id);

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
