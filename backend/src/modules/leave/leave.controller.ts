import { Request, Response, NextFunction } from "express";
import { LeaveRequest } from "./leaveRequest.model";
import { Employee } from "../employees/employee.model";
import { AppError } from "../../middlewares/errorHandler";
import { createAuditLog } from "../logs/log.service";
import { LeaveType } from "./leaveType.model";
import { AttendanceRecord } from "../attendance/attendance.model";
import { calculateLeaveBalanceForType } from "./leaveBalance.service";
export const getLeaveRequests = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { status, employeeId } = req.query;
    const query: any = {};

    if (status && status !== "all") {
      query.status = status.toString().toUpperCase();
    }

    if (employeeId) {
      query.employeeId = employeeId;
    }

    const requests = await LeaveRequest.find(query)
      .populate("employeeId", "firstName lastName employeeCode")
      .populate("leaveTypeId", "name code")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: requests.map((req) => ({
        id: req._id.toString(),
        employee_name: `${(req.employeeId as any).firstName} ${(req.employeeId as any).lastName}`,
        employee_id: req.employeeId.toString(),
        leave_type: (req.leaveTypeId as any)?.name || "Unknown",
        casual_type: req.casualType,
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
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const request = await LeaveRequest.findById(id)
      .populate("employeeId")
      .populate("leaveTypeId");

    if (!request) {
      throw new AppError(404, "Leave request not found");
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
  next: NextFunction,
) => {
  try {
    const { employeeCode, leaveTypeId, startDate, days } = req.body;

    const employee = await Employee.findOne({ employeeCode: employeeCode });
    const leaveType = await LeaveType.findById(leaveTypeId);

    if (!employee)
      throw new AppError(404, `Employee with code ${employeeCode} not found`);
    if (!leaveType) throw new AppError(404, "Leave type not found");

    const casualType = req.body.casualType || "PAID";
    const balanceResult = await calculateLeaveBalanceForType(
      employee as any,
      leaveType as any,
      {
        asOfDate: new Date(startDate || Date.now()),
        casualType,
      },
    );
    const currentBalance = balanceResult.currentBalance;

    const isUnpaidCasual =
      leaveType.code?.toUpperCase() === "CASUAL" &&
      (casualType === "UNPAID_AUTHORIZED" ||
        casualType === "UNPAID_UNAUTHORIZED");

    if (!isUnpaidCasual && days > currentBalance) {
      throw new AppError(
        400,
        `Insufficient leave balance. Available: ${currentBalance}`,
      );
    }

    // The leaves that cant take in certain period and check if the leave request is valid logic go here
    //  Blackout Period (example: Last week in December no leave allow)

    // Map employee _id back into req.body so it saves correctly
    req.body.employeeId = employee._id;
    req.body.balance = currentBalance;
    // TODO: Implement the approver chain based on the leave type and employee's role
    req.body.approverChain = [
      {
        role: "MANAGER",
        status: "PENDING",
      },
      {
        role: "HR_ADMIN",
        status: "PENDING",
      },
    ];

    const request = new LeaveRequest(req.body);
    await request.save();

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: "CREATE",
      module: "Leave",
      resourceType: "leave_request",
      resourceId: request._id.toString(),
      ipAddress: req.ip || "unknown",
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
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const request = await LeaveRequest.findById(id);

    if (!request) {
      throw new AppError(404, "Leave request not found");
    }

    // Business logic: Update status based on approver role
    if (req.user!.roles.includes("MANAGER")) {
      request.status = "MANAGER_APPROVED";
    } else if (
      req.user!.roles.includes("HR_ADMIN") ||
      req.user!.roles.includes("ADMIN")
    ) {
      request.status = "HR_APPROVED";
    }

    await request.save();

    //if leave approved we update attendance status in calender
    if (request.status === "HR_APPROVED") {
      let curr = new Date(request.startDate);
      curr.setHours(0, 0, 0, 0);
      const end = new Date(request.endDate);
      end.setHours(0, 0, 0, 0);

      while (curr <= end) {
        const day = curr.getDay();
        // Skip weekends
        if (day !== 0 && day !== 6) {
          //if there is already attendance record for this date, we update it
          //if there is no attendance record for this date, we create it
          await AttendanceRecord.findOneAndUpdate(
            {
              employeeId: request.employeeId,
              date: new Date(curr),
            },
            {
              $set: {
                status: "LEAVE",
                notes: `Leave Request ID: ${request._id}`,
              },
            },
            { upsert: true, new: true },
          );
        }
        curr.setDate(curr.getDate() + 1);
      }
    }

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: "APPROVE",
      module: "Leave",
      resourceType: "leave_request",
      resourceId: id,
      ipAddress: req.ip || "unknown",
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
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const request = await LeaveRequest.findById(id);

    if (!request) {
      throw new AppError(404, "Leave request not found");
    }

    const oldStatus = request.status;
    request.status = "REJECTED";
    await request.save();

    //we only need to clean the leave if the leave was approved by HR
    if (oldStatus === "HR_APPROVED") {
      const start = new Date(request.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(request.endDate);
      end.setHours(23, 59, 59, 999);

      await AttendanceRecord.deleteMany({
        employeeId: request.employeeId,
        date: { $gte: start, $lte: end },
        status: "LEAVE",
        notes: `Leave Request ID: ${request._id}`,
      });
    }

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: "REJECT",
      module: "Leave",
      resourceType: "leave_request",
      resourceId: id,
      ipAddress: req.ip || "unknown",
    });

    res.json({
      success: true,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

//send all the available leave types
export const getLeaveTypes = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const leaveTypes = await LeaveType.find().sort({ name: 1 });
    res.json({
      success: true,
      data: leaveTypes,
    });
  } catch (error) {
    next(error);
  }
};
