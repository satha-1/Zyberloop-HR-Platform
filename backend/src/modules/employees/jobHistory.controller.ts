import { Request, Response, NextFunction } from 'express';
import { createJobChange, getJobTimeline, getCurrentJobRecord, CreateJobChangePayload } from './jobHistory.service';
import { Employee } from './employee.model';
import { AppError } from '../../middlewares/errorHandler';

/**
 * POST /employees/:employeeId/job-advancement
 * Create a new job change record
 */
export const createJobAdvancement = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { employeeId } = req.params;
    const {
      actionType,
      effectiveFrom,
      departmentId,
      managerId,
      jobTitle,
      employmentType,
      workLocation,
      salaryPackageId,
      grade,
      notes,
    } = req.body;

    if (!actionType || !effectiveFrom) {
      throw new AppError(400, 'actionType and effectiveFrom are required');
    }

    const payload: CreateJobChangePayload = {
      actionType,
      effectiveFrom: new Date(effectiveFrom),
      departmentId,
      managerId,
      jobTitle,
      employmentType,
      workLocation,
      salaryPackageId,
      grade,
      notes,
      createdBy: (req as any).user?._id?.toString(), // From auth middleware
    };

    const result = await createJobChange(employeeId, payload);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /employees/:employeeId/job-timeline
 * Get the job timeline for an employee
 */
export const getJobTimelineEndpoint = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { employeeId } = req.params;
    const timeline = await getJobTimeline(employeeId);

    res.json({
      success: true,
      data: timeline,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /employees/:employeeId/job-advancement/current
 * Get the current job record for an employee
 */
export const getCurrentJobRecordEndpoint = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { employeeId } = req.params;
    const currentRecord = await getCurrentJobRecord(employeeId);

    if (!currentRecord) {
      // Return employee's current values as fallback
      const employee = await Employee.findById(employeeId)
        .populate('departmentId', 'name code')
        .populate('managerId', 'firstName lastName fullName employeeCode')
        .lean();

      if (!employee) {
        throw new AppError(404, 'Employee not found');
      }

      return res.json({
        success: true,
        data: {
          departmentId: employee.departmentId,
          managerId: employee.managerId,
          jobTitle: employee.jobTitle,
          employmentType: employee.employmentType,
          workLocation: employee.workLocation,
          grade: employee.grade,
        },
      });
    }

    res.json({
      success: true,
      data: currentRecord,
    });
  } catch (error) {
    next(error);
  }
};
