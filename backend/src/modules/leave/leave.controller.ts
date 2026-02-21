import { Request, Response, NextFunction } from 'express';
import { LeaveRequest } from './leaveRequest.model';
import { Employee } from '../employees/employee.model';
import { AppError } from '../../middlewares/errorHandler';
import { createAuditLog } from '../logs/log.service';

export const getLeaveRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, employeeId } = req.query;
    const query: any = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (employeeId) {
      query.employeeId = employeeId;
    }

    const requests = await LeaveRequest.find(query)
      .populate('employeeId', 'firstName lastName employeeCode')
      .populate('leaveTypeId', 'name code')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: requests.map((req) => ({
        id: req._id.toString(),
        employee_name: `${(req.employeeId as any).firstName} ${(req.employeeId as any).lastName}`,
        employee_id: req.employeeId.toString(),
        leave_type: (req.leaveTypeId as any)?.name || 'Unknown',
        start_date: req.startDate.toISOString(),
        end_date: req.endDate.toISOString(),
        days: req.days,
        status: req.status.toLowerCase(),
        balance: req.balance,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const getLeaveRequestById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const request = await LeaveRequest.findById(id)
      .populate('employeeId')
      .populate('leaveTypeId');

    if (!request) {
      throw new AppError(404, 'Leave request not found');
    }

    res.json({
      success: true,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

export const createLeaveRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const request = new LeaveRequest(req.body);
    await request.save();

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'CREATE',
      module: 'Leave',
      resourceType: 'leave_request',
      resourceId: request._id.toString(),
      ipAddress: req.ip || 'unknown',
    });

    res.status(201).json({
      success: true,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

export const approveLeaveRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const request = await LeaveRequest.findById(id);

    if (!request) {
      throw new AppError(404, 'Leave request not found');
    }

    // Business logic: Update status based on approver role
    if (req.user!.roles.includes('MANAGER')) {
      request.status = 'MANAGER_APPROVED';
    } else if (req.user!.roles.includes('HR_ADMIN') || req.user!.roles.includes('ADMIN')) {
      request.status = 'HR_APPROVED';
    }

    await request.save();

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'APPROVE',
      module: 'Leave',
      resourceType: 'leave_request',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
    });

    res.json({
      success: true,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

export const rejectLeaveRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const request = await LeaveRequest.findById(id);

    if (!request) {
      throw new AppError(404, 'Leave request not found');
    }

    request.status = 'REJECTED';
    await request.save();

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'REJECT',
      module: 'Leave',
      resourceType: 'leave_request',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
    });

    res.json({
      success: true,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};
