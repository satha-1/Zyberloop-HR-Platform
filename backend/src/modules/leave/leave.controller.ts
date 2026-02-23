import { Request, Response, NextFunction } from 'express';
import { LeaveRequest } from './leaveRequest.model';
import { Employee } from '../employees/employee.model';
import { AppError } from '../../middlewares/errorHandler';
import { createAuditLog } from '../logs/log.service';
import mongoose from 'mongoose';
import { LeaveType } from './leaveType.model';

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

//current logic save leave request directly to the database, validation missing
export const createLeaveRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {employeeId, leaveTypeId, startDate, days} = req.body;

    const emplyee = await Employee.findById(employeeId);
    const leaveType = await LeaveType.findById(leaveTypeId);

    if(!emplyee) throw new AppError(404, 'Empleyee not found');
    if(!leaveType) throw new AppError(404, 'Leave type not found');

    // Accrual logic
    const hireDate = new Date(emplyee.hireDate);
    const now = new Date();
    // calculate months worked
    const monthsWorked = (now.getFullYear() - hireDate.getFullYear()) * 12 + (now.getMonth() - hireDate.getMonth());
    // calculate total accrued in that leave type
    const totalAccrued = monthsWorked * (leaveType.accrualRule?.perMonth || 0);
    // calculate taken in that leave type
    const takenAccrued = await LeaveRequest.aggregate([
      { 
        $match: { 
          employeeId: new mongoose.Types.ObjectId(employeeId), 
          leaveTypeId: new mongoose.Types.ObjectId(leaveTypeId), 
          status: 'HR_APPROVED' 
        } 
      },
      { 
        $group: { _id: null, total: { $sum: '$days' } } 
      }
    ]);

    // We need to implement the carryIn from previous year and encashedLeaves logic later
    // For now, we will consider it as 0
    const carryIn = 0;
    const encashedLeaves = 0;

    // Calculate current balance
    const currentBalance = totalAccrued - (takenAccrued[0]?.total || 0) + carryIn - encashedLeaves;

    // Check if the leave request is valid
    if (days > currentBalance) {
      throw new AppError(400, `Insufficient leave balance. Available: ${currentBalance}`);
    }    

    // The leaves that cant take in certain period and check if the leave request is valid logic go here
    //  Blackout Period (example: Last week in December no leave allow)

    // Add calculated balance and default approver chain to req.body 
    req.body.balance = currentBalance;
    req.body.approverChain = [
      {
        role: 'MANAGER',
        status: 'PENDING',
      },
      {
        role: 'HR_ADMIN',
        status: 'PENDING',
      },
    ];

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
