import mongoose from 'mongoose';
import { Employee } from './employee.model';
import {
  EmployeeJobAdvancement,
  IEmployeeJobAdvancement,
  JobAdvancementActionType,
} from './employeeJobAdvancement.model';
import { Department } from '../departments/department.model';
import { AppError } from '../../middlewares/errorHandler';

export interface CreateJobChangePayload {
  actionType: JobAdvancementActionType;
  effectiveFrom: Date;
  departmentId?: string;
  managerId?: string;
  jobTitle?: string;
  employmentType?: 'permanent' | 'contract' | 'intern' | 'casual';
  workLocation?: string;
  salaryPackageId?: string;
  grade?: string;
  notes?: string;
  createdBy?: string;
}

export interface TimelineEntry {
  id: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  actionType: JobAdvancementActionType;
  title: string;
  changes: string[];
  department?: { id: string; name: string; code: string };
  manager?: { id: string; name: string; code: string };
  jobTitle?: string;
  employmentType?: string;
  workLocation?: string;
  grade?: string;
  notes?: string;
}

/**
 * Creates a new job change record and closes the previous one
 */
export async function createJobChange(
  employeeId: string,
  payload: CreateJobChangePayload
): Promise<IEmployeeJobAdvancement> {
  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    throw new AppError(400, 'Invalid employee ID');
  }

  const employee = await Employee.findById(employeeId);
  if (!employee) {
    throw new AppError(404, 'Employee not found');
  }

  // Validate effective date is >= hire date
  if (new Date(payload.effectiveFrom) < employee.hireDate) {
    throw new AppError(
      400,
      `Effective date must be on or after hire date (${employee.hireDate.toISOString().split('T')[0]})`
    );
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find current job history record (effectiveTo IS NULL)
    const currentRecord = await EmployeeJobAdvancement.findOne({
      employeeId,
      effectiveTo: null,
    }).session(session);

    // Validate effective date is >= last history effectiveFrom
    if (currentRecord) {
      if (new Date(payload.effectiveFrom) < currentRecord.effectiveFrom) {
        throw new AppError(
          400,
          `Effective date must be on or after the last job change date (${currentRecord.effectiveFrom.toISOString().split('T')[0]})`
        );
      }

      // Close the previous record (set effectiveTo to day before new effective date)
      const prevEffectiveTo = new Date(payload.effectiveFrom);
      prevEffectiveTo.setDate(prevEffectiveTo.getDate() - 1);
      currentRecord.effectiveTo = prevEffectiveTo;
      await currentRecord.save({ session });
    }

    // Build new record by copying forward unchanged fields from current record or employee
    const newRecordData: any = {
      employeeId,
      actionType: payload.actionType,
      effectiveFrom: payload.effectiveFrom,
      effectiveTo: null, // This is the new current record
    };

    // Copy forward unchanged fields from current record or employee
    if (currentRecord) {
      newRecordData.departmentId = payload.departmentId
        ? new mongoose.Types.ObjectId(payload.departmentId)
        : currentRecord.departmentId;
      newRecordData.managerId = payload.managerId
        ? new mongoose.Types.ObjectId(payload.managerId)
        : currentRecord.managerId;
      newRecordData.jobTitle = payload.jobTitle ?? currentRecord.jobTitle;
      newRecordData.employmentType = payload.employmentType ?? currentRecord.employmentType;
      newRecordData.workLocation = payload.workLocation ?? currentRecord.workLocation;
      newRecordData.salaryPackageId = payload.salaryPackageId
        ? new mongoose.Types.ObjectId(payload.salaryPackageId)
        : currentRecord.salaryPackageId;
      newRecordData.grade = payload.grade ?? currentRecord.grade;
    } else {
      // First job record - use employee's current values
      newRecordData.departmentId = payload.departmentId
        ? new mongoose.Types.ObjectId(payload.departmentId)
        : employee.departmentId;
      newRecordData.managerId = payload.managerId
        ? new mongoose.Types.ObjectId(payload.managerId)
        : employee.managerId;
      newRecordData.jobTitle = payload.jobTitle ?? employee.jobTitle;
      newRecordData.employmentType = payload.employmentType ?? employee.employmentType;
      newRecordData.workLocation = payload.workLocation ?? employee.workLocation;
      newRecordData.grade = payload.grade ?? employee.grade;
    }

    if (payload.notes) {
      newRecordData.notes = payload.notes;
    }
    if (payload.createdBy) {
      newRecordData.createdBy = new mongoose.Types.ObjectId(payload.createdBy);
    }

    // Create new job history record
    const newRecord = new EmployeeJobAdvancement(newRecordData);
    await newRecord.save({ session });

    // Update denormalized fields on employee
    const updateData: any = {};
    if (newRecordData.departmentId) {
      updateData.currentDepartmentId = newRecordData.departmentId;
      updateData.departmentId = newRecordData.departmentId; // Also update main field
    }
    if (newRecordData.managerId) {
      updateData.currentManagerId = newRecordData.managerId;
      updateData.managerId = newRecordData.managerId; // Also update main field
    }
    if (newRecordData.jobTitle) {
      updateData.currentJobTitle = newRecordData.jobTitle;
      updateData.jobTitle = newRecordData.jobTitle; // Also update main field
    }
    if (newRecordData.employmentType) {
      updateData.currentEmploymentType = newRecordData.employmentType;
      updateData.employmentType = newRecordData.employmentType; // Also update main field
    }
    if (newRecordData.salaryPackageId) {
      updateData.currentSalaryPackageId = newRecordData.salaryPackageId;
    }

    await Employee.findByIdAndUpdate(employeeId, updateData, { session });

    await session.commitTransaction();

    // Populate and return
    return await EmployeeJobAdvancement.findById(newRecord._id)
      .populate('departmentId', 'name code')
      .populate('managerId', 'firstName lastName fullName employeeCode')
      .populate('createdBy', 'firstName lastName email')
      .lean();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Gets the job timeline for an employee with change summaries
 */
export async function getJobTimeline(employeeId: string): Promise<TimelineEntry[]> {
  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    throw new AppError(400, 'Invalid employee ID');
  }

  const employee = await Employee.findById(employeeId);
  if (!employee) {
    throw new AppError(404, 'Employee not found');
  }

  // Get all job history records ordered by effectiveFrom (ascending for processing, will reverse at end)
  const historyRecords = await EmployeeJobAdvancement.find({ employeeId })
    .populate('departmentId', 'name code')
    .populate('managerId', 'firstName lastName fullName employeeCode')
    .sort({ effectiveFrom: 1 })
    .lean();

  // Always include initial hire record
  const dept = employee.departmentId
    ? await Department.findById(employee.departmentId).select('name code').lean()
    : null;
  const manager = employee.managerId
    ? await Employee.findById(employee.managerId).select('firstName lastName fullName employeeCode').lean()
    : null;

  // Find the earliest job advancement record to determine if we need to show initial hire
  const earliestRecord = historyRecords.length > 0 ? historyRecords[0] : null;
  const shouldShowInitialHire = !earliestRecord || 
    new Date(earliestRecord.effectiveFrom) > employee.hireDate;

  const timeline: TimelineEntry[] = [];

  // Add initial hire record if needed
  if (shouldShowInitialHire) {
    let initialEffectiveTo: Date | undefined = undefined;
    if (earliestRecord) {
      initialEffectiveTo = new Date(earliestRecord.effectiveFrom);
      initialEffectiveTo.setDate(initialEffectiveTo.getDate() - 1);
    }
    
    timeline.push({
      id: 'initial',
      effectiveFrom: employee.hireDate,
      effectiveTo: initialEffectiveTo,
      actionType: 'OTHER' as JobAdvancementActionType,
      title: `Joined as ${employee.jobTitle || 'Employee'}`,
      changes: ['Initial employment'],
      department: dept ? { id: dept._id.toString(), name: dept.name, code: dept.code } : undefined,
      manager: manager
        ? {
            id: manager._id.toString(),
            name: `${manager.firstName || ''} ${manager.lastName || ''}`.trim() || manager.fullName || 'N/A',
            code: manager.employeeCode || 'N/A',
          }
        : undefined,
      jobTitle: employee.jobTitle,
      employmentType: employee.employmentType,
      workLocation: employee.workLocation,
      grade: employee.grade,
    });
  }

  // Set previousRecord for comparison - use initial hire data if shown, otherwise null
  let previousRecord: any = null;
  if (shouldShowInitialHire) {
    previousRecord = {
      departmentId: employee.departmentId ? { _id: employee.departmentId, name: dept?.name, code: dept?.code } : null,
      managerId: employee.managerId ? { 
        _id: employee.managerId, 
        firstName: manager?.firstName, 
        lastName: manager?.lastName,
        fullName: manager?.fullName,
        employeeCode: manager?.employeeCode
      } : null,
      jobTitle: employee.jobTitle,
      employmentType: employee.employmentType,
      workLocation: employee.workLocation,
      grade: employee.grade,
    };
  } else if (historyRecords.length > 0) {
    // If no initial hire shown, use the first record as previous (shouldn't happen, but safety)
    previousRecord = historyRecords[0];
  }

  for (const record of historyRecords) {
    const changes: string[] = [];
    let title = '';

    // Compare with previous record to detect changes
    if (previousRecord) {
      // Department change
      const prevDeptId = previousRecord.departmentId?._id?.toString() || previousRecord.departmentId?.toString();
      const currDeptId = record.departmentId?._id?.toString() || record.departmentId?.toString();
      if (prevDeptId !== currDeptId) {
        const prevDept = previousRecord.departmentId?.name || 'N/A';
        const currDept = record.departmentId?.name || 'N/A';
        changes.push(`Department: ${prevDept} → ${currDept}`);
      }

      // Manager change
      const prevMgrId = previousRecord.managerId?._id?.toString() || previousRecord.managerId?.toString();
      const currMgrId = record.managerId?._id?.toString() || record.managerId?.toString();
      if (prevMgrId !== currMgrId) {
        const prevMgr = previousRecord.managerId
          ? `${previousRecord.managerId.firstName || ''} ${previousRecord.managerId.lastName || ''}`.trim() ||
            previousRecord.managerId.fullName ||
            'N/A'
          : 'N/A';
        const currMgr = record.managerId
          ? `${record.managerId.firstName || ''} ${record.managerId.lastName || ''}`.trim() ||
            record.managerId.fullName ||
            'N/A'
          : 'N/A';
        changes.push(`Manager: ${prevMgr} → ${currMgr}`);
      }

      // Job title change
      if (previousRecord.jobTitle !== record.jobTitle) {
        changes.push(`Job Title: ${previousRecord.jobTitle || 'N/A'} → ${record.jobTitle || 'N/A'}`);
      }

      // Employment type change
      if (previousRecord.employmentType !== record.employmentType) {
        changes.push(
          `Employment Type: ${previousRecord.employmentType || 'N/A'} → ${record.employmentType || 'N/A'}`
        );
      }

      // Location change
      if (previousRecord.workLocation !== record.workLocation) {
        changes.push(`Location: ${previousRecord.workLocation || 'N/A'} → ${record.workLocation || 'N/A'}`);
      }

      // Grade change
      if (previousRecord.grade !== record.grade) {
        changes.push(`Grade: ${previousRecord.grade || 'N/A'} → ${record.grade || 'N/A'}`);
      }
    }

    // Generate title based on action type
    switch (record.actionType) {
      case 'PROMOTION':
        title = `Promoted to ${record.jobTitle || 'New Position'}`;
        if (!changes.length && record.jobTitle) {
          changes.push(`Promoted to ${record.jobTitle}`);
        }
        break;
      case 'TRANSFER':
        title = `Transferred${record.departmentId ? ` to ${record.departmentId.name}` : ''}`;
        break;
      case 'SALARY_REVISION':
        title = 'Salary Revision';
        break;
      case 'MANAGER_CHANGE':
        title = 'Manager Change';
        break;
      case 'EMPLOYMENT_TYPE_CHANGE':
        title = `Employment Type Changed to ${record.employmentType?.toUpperCase() || 'N/A'}`;
        break;
      case 'GRADE_CHANGE':
        title = `Grade Changed to ${record.grade || 'N/A'}`;
        break;
      default:
        title = record.jobTitle ? `Job Change: ${record.jobTitle}` : 'Job Change';
    }

    // If no changes detected but this is not the first record, add a generic change
    if (!changes.length && previousRecord) {
      changes.push('Job details updated');
    }

    timeline.push({
      id: record._id.toString(),
      effectiveFrom: record.effectiveFrom,
      effectiveTo: record.effectiveTo || undefined,
      actionType: record.actionType,
      title,
      changes,
      department: record.departmentId
        ? {
            id: record.departmentId._id.toString(),
            name: record.departmentId.name,
            code: record.departmentId.code,
          }
        : undefined,
      manager: record.managerId
        ? {
            id: record.managerId._id.toString(),
            name:
              `${record.managerId.firstName || ''} ${record.managerId.lastName || ''}`.trim() ||
              record.managerId.fullName ||
              'N/A',
            code: record.managerId.employeeCode || 'N/A',
          }
        : undefined,
      jobTitle: record.jobTitle,
      employmentType: record.employmentType,
      workLocation: record.workLocation,
      grade: record.grade,
      notes: record.notes,
    });

    previousRecord = record;
  }

  // Reverse timeline to show most recent first (newest at top)
  return timeline.reverse();
}

/**
 * Gets the current job record for an employee
 */
export async function getCurrentJobRecord(employeeId: string): Promise<IEmployeeJobAdvancement | null> {
  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    throw new AppError(400, 'Invalid employee ID');
  }

  return await EmployeeJobAdvancement.findOne({
    employeeId,
    effectiveTo: null,
  })
    .populate('departmentId', 'name code')
    .populate('managerId', 'firstName lastName fullName employeeCode')
    .lean();
}
