import { Request, Response, NextFunction } from 'express';
import { AttendanceRecord } from './attendance.model';
import { AppError } from '../../middlewares/errorHandler';
import { createAuditLog } from '../logs/log.service';

export const getAttendanceRecords = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { employeeId, startDate, endDate, status } = req.query;
    const query: any = {};

    if (employeeId) {
      query.employeeId = employeeId;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }

    if (status) {
      query.status = status;
    }

    const records = await AttendanceRecord.find(query)
      .populate('employeeId', 'firstName lastName employeeCode')
      .sort({ date: -1 });

    res.json({
      success: true,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

export const createAttendanceRecord = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { employeeId, date, status, checkIn, checkOut, lateMinutes, overTimeMinutes, notes } = req.body;

    if (!employeeId || !date) {
      throw new AppError(400, 'Employee ID and date are required');
    }

    const record = new AttendanceRecord({
      employeeId,
      date: new Date(date),
      status: status || 'PRESENT',
      checkIn: checkIn ? new Date(checkIn) : undefined,
      checkOut: checkOut ? new Date(checkOut) : undefined,
      lateMinutes: lateMinutes || 0,
      overTimeMinutes: overTimeMinutes || 0,
      notes,
    });

    await record.save();

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'CREATE',
      module: 'Attendance',
      resourceType: 'attendance_record',
      resourceId: record._id.toString(),
      ipAddress: req.ip || 'unknown',
    });

    res.status(201).json({
      success: true,
      data: record,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      throw new AppError(400, 'Attendance record already exists for this date');
    }
    next(error);
  }
};

export const updateAttendanceRecord = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.date) updateData.date = new Date(updateData.date);
    if (updateData.checkIn) updateData.checkIn = new Date(updateData.checkIn);
    if (updateData.checkOut) updateData.checkOut = new Date(updateData.checkOut);

    const record = await AttendanceRecord.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('employeeId', 'firstName lastName employeeCode');

    if (!record) {
      throw new AppError(404, 'Attendance record not found');
    }

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'UPDATE',
      module: 'Attendance',
      resourceType: 'attendance_record',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
    });

    res.json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAttendanceRecord = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const record = await AttendanceRecord.findByIdAndDelete(id);

    if (!record) {
      throw new AppError(404, 'Attendance record not found');
    }

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'DELETE',
      module: 'Attendance',
      resourceType: 'attendance_record',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
    });

    res.json({
      success: true,
      message: 'Attendance record deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
