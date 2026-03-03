import mongoose from 'mongoose';
import { Employee, IEmployee } from '../employees/employee.model';
import { EmployeeServiceDates } from '../employees/employeeProfile.models';
import { LeaveRequest } from './leaveRequest.model';
import { ILeaveType } from './leaveType.model';

type BalanceOptions = {
  asOfDate?: Date;
  casualType?: 'PAID' | 'UNPAID_AUTHORIZED' | 'UNPAID_UNAUTHORIZED';
};

export async function getEffectiveJoinDate(employee: IEmployee): Promise<Date> {
  const serviceDates = await EmployeeServiceDates.findOne({ employeeId: employee._id })
    .select('hireDate')
    .lean();

  return serviceDates?.hireDate ? new Date(serviceDates.hireDate) : new Date(employee.hireDate);
}

function calculateMonthsWorked(joinDate: Date, asOfDate: Date): number {
  const months =
    (asOfDate.getFullYear() - joinDate.getFullYear()) * 12 +
    (asOfDate.getMonth() - joinDate.getMonth());

  return Math.max(0, months);
}

function calculateAccruedDays(
  leaveType: ILeaveType,
  joinDate: Date,
  asOfDate: Date
): number {
  const monthsWorked = calculateMonthsWorked(joinDate, asOfDate);
  const yearsWorked = Math.floor(monthsWorked / 12);
  const typeCode = leaveType.code?.toUpperCase() || '';

  if (typeCode === 'CASUAL') {
    return monthsWorked * 0.5;
  }

  if (typeCode === 'ANNUAL' || typeCode === 'SICK') {
    if (yearsWorked < 1) {
      return 0;
    }

    const joinMonth = joinDate.getMonth(); // 0-based
    let secondYearEntitlement = 0;

    if (joinMonth <= 2) {
      secondYearEntitlement = 14;
    } else if (joinMonth <= 5) {
      secondYearEntitlement = 10;
    } else if (joinMonth <= 8) {
      secondYearEntitlement = 7;
    } else {
      secondYearEntitlement = 4;
    }

    if (yearsWorked === 1) {
      return secondYearEntitlement;
    }

    const fullYearsAfterSecond = yearsWorked - 1;
    return secondYearEntitlement + fullYearsAfterSecond * 14;
  }

  return monthsWorked * (leaveType.accrualRule?.perMonth || 0);
}

async function getApprovedTaken(
  employeeId: mongoose.Types.ObjectId,
  leaveTypeId: mongoose.Types.ObjectId
): Promise<number> {
  const taken = await LeaveRequest.aggregate([
    {
      $match: {
        employeeId,
        leaveTypeId,
        status: 'HR_APPROVED',
      },
    },
    {
      $group: { _id: null, total: { $sum: '$days' } },
    },
  ]);

  return Number(taken?.[0]?.total || 0);
}

async function getApprovedTakenYTD(
  employeeId: mongoose.Types.ObjectId,
  leaveTypeId: mongoose.Types.ObjectId,
  asOfDate: Date
): Promise<number> {
  const startOfYear = new Date(asOfDate.getFullYear(), 0, 1);
  const endOfYear = new Date(asOfDate.getFullYear(), 11, 31, 23, 59, 59, 999);

  const taken = await LeaveRequest.aggregate([
    {
      $match: {
        employeeId,
        leaveTypeId,
        status: 'HR_APPROVED',
        startDate: { $gte: startOfYear, $lte: endOfYear },
      },
    },
    {
      $group: { _id: null, total: { $sum: '$days' } },
    },
  ]);

  return Number(taken?.[0]?.total || 0);
}

export async function calculateLeaveBalanceForType(
  employee: IEmployee,
  leaveType: ILeaveType,
  options: BalanceOptions = {}
) {
  const asOfDate = options.asOfDate || new Date();
  const casualType = options.casualType || 'PAID';
  const typeCode = leaveType.code?.toUpperCase() || '';
  const isUnpaidCasual =
    typeCode === 'CASUAL' &&
    (casualType === 'UNPAID_AUTHORIZED' || casualType === 'UNPAID_UNAUTHORIZED');

  const joinDate = await getEffectiveJoinDate(employee);
  const leaveTypeObjectId = new mongoose.Types.ObjectId(leaveType._id as any);

  const includesPendingApprovals =
    (await LeaveRequest.exists({
      employeeId: employee._id,
      leaveTypeId: leaveTypeObjectId,
      status: { $in: ['PENDING', 'MANAGER_APPROVED'] },
    })) !== null;

  if (isUnpaidCasual) {
    return {
      joinDate,
      accruedTotal: 0,
      takenTotal: 0,
      takenYTD: 0,
      currentBalance: 0,
      includesPendingApprovals,
    };
  }

  const accruedTotal = calculateAccruedDays(leaveType, joinDate, asOfDate);
  const takenTotal = await getApprovedTaken(employee._id as mongoose.Types.ObjectId, leaveTypeObjectId);
  const takenYTD = await getApprovedTakenYTD(
    employee._id as mongoose.Types.ObjectId,
    leaveTypeObjectId,
    asOfDate
  );

  const carryIn = 0;
  const encashedLeaves = 0;
  const currentBalance = accruedTotal - takenTotal + carryIn - encashedLeaves;

  return {
    joinDate,
    accruedTotal,
    takenTotal,
    takenYTD,
    currentBalance,
    includesPendingApprovals,
  };
}

export async function getEmployeeByCode(employeeCode: string): Promise<IEmployee | null> {
  return Employee.findOne({ employeeCode });
}
