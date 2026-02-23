import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Employee } from './employee.model';
import { AppError } from '../../middlewares/errorHandler';
import {
  EmployeeServiceDates,
  EmployeeAssignedRole,
  EmployeeSupportRole,
  EmployeeOrganization,
  EmployeeCompensationProfile,
  EmployeeJobHistory,
  EmployeeExternalInteractions,
  EmployeeAdditionalData,
  EmployeeBenefit,
} from './employeeProfile.models';
import { LeaveRequest } from '../leave/leaveRequest.model';
import { LeaveType } from '../leave/leaveType.model';
import { PayrollEntry } from '../payroll/payrollEntry.model';
import { Goal, PerformanceCycle } from '../performance/performance.model';

// Helper function to calculate length of service
function calculateLengthOfService(startDate: Date, endDate?: Date): string {
  const end = endDate || new Date();
  const start = new Date(startDate);
  
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();
  
  if (days < 0) {
    months--;
    const lastMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += lastMonth.getDate();
  }
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  return `${years} year(s), ${months} month(s), ${days} day(s)`;
}

// Helper to check permissions (simplified - extend based on your RBAC)
async function checkProfileAccess(req: Request, employeeId: string): Promise<boolean> {
  // For now, allow authenticated users. Extend with proper RBAC later.
  return !!req.user;
}

// GET /api/employees/:employeeId/profile/summary
export const getProfileSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { employeeId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      throw new AppError(400, 'Invalid employee ID');
    }
    
    if (!(await checkProfileAccess(req, employeeId))) {
      throw new AppError(403, 'Access denied');
    }
    
    const employee = await Employee.findById(employeeId)
      .populate('departmentId', 'name')
      .populate('managerId', 'firstName lastName employeeCode email');
    
    if (!employee) {
      throw new AppError(404, 'Employee not found');
    }
    
    const serviceDates = await EmployeeServiceDates.findOne({ employeeId });
    const lengthOfService = serviceDates?.hireDate
      ? calculateLengthOfService(serviceDates.hireDate)
      : calculateLengthOfService(employee.hireDate);
    
    res.json({
      success: true,
      data: {
        employeeId: employee._id,
        employeeCode: employee.employeeCode,
        name: `${employee.firstName} ${employee.lastName}`,
        jobTitle: employee.grade, // Using grade as job title for now
        organization: (employee.departmentId as any)?.name || 'N/A',
        department: (employee.departmentId as any)?.name || 'N/A',
        primaryManager: employee.managerId
          ? {
              name: `${(employee.managerId as any).firstName} ${(employee.managerId as any).lastName}`,
              employeeCode: (employee.managerId as any).employeeCode,
              email: (employee.managerId as any).email,
            }
          : null,
        lengthOfService,
        status: employee.status,
        hireDate: serviceDates?.hireDate || employee.hireDate,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/employees/:employeeId/profile/job
export const getProfileJob = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { employeeId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      throw new AppError(400, 'Invalid employee ID');
    }
    
    const employee = await Employee.findById(employeeId)
      .populate('departmentId', 'name code')
      .populate('managerId', 'firstName lastName employeeCode email');
    
    if (!employee) {
      throw new AppError(404, 'Employee not found');
    }
    
    const serviceDates = await EmployeeServiceDates.findOne({ employeeId });
    
    res.json({
      success: true,
      data: {
        employeeId: employee._id.toString(),
        employeeCode: employee.employeeCode,
        organization: (employee.departmentId as any)?.name || 'N/A',
        position: employee.grade,
        jobProfile: employee.grade, // Can be extended
        jobFamily: 'General', // Can be extended
        employeeType: 'PERMANENT', // Can be extended
        timeType: 'FULL_TIME', // Can be extended
        fte: 1.0, // Can be extended
        grade: employee.grade,
        level: employee.grade, // Can be extended
        location: (employee.departmentId as any)?.name || 'N/A',
        hireDate: serviceDates?.hireDate || employee.hireDate,
        originalHireDate: serviceDates?.originalHireDate || serviceDates?.hireDate || employee.hireDate,
        continuousServiceDate: serviceDates?.continuousServiceDate || serviceDates?.hireDate || employee.hireDate,
        probationEndDate: serviceDates?.probationEndDate,
        lengthOfService: serviceDates?.hireDate
          ? calculateLengthOfService(serviceDates.hireDate)
          : calculateLengthOfService(employee.hireDate),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/employees/:employeeId/profile/compensation
export const getProfileCompensation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { employeeId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      throw new AppError(400, 'Invalid employee ID');
    }
    
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      throw new AppError(404, 'Employee not found');
    }
    
    let compensationProfile = await EmployeeCompensationProfile.findOne({ employeeId });
    
    // If no profile exists, create one from employee salary
    if (!compensationProfile) {
      compensationProfile = await EmployeeCompensationProfile.create({
        employeeId,
        currency: 'LKR',
        planAssignments: [
          {
            effectiveDate: employee.hireDate,
            planType: 'Salary',
            compensationPlan: 'Base Salary',
            annualAmountLKR: employee.salary * 12,
          },
        ],
      });
    }
    
    // Calculate totals
    const totalSalary = compensationProfile.planAssignments
      .filter((p) => p.planType === 'Salary')
      .reduce((sum, p) => sum + p.annualAmountLKR, 0);
    
    const totalAllowances = compensationProfile.planAssignments
      .filter((p) => p.planType === 'Allowance')
      .reduce((sum, p) => sum + p.annualAmountLKR, 0);
    
    res.json({
      success: true,
      data: {
        compensationPackageName: compensationProfile.compensationPackageName,
        compensationGrade: compensationProfile.compensationGrade,
        gradeProfile: compensationProfile.gradeProfile,
        company: compensationProfile.company,
        currency: compensationProfile.currency,
        totals: {
          salary: totalSalary,
          allowances: totalAllowances,
          total: totalSalary + totalAllowances,
        },
        planAssignments: compensationProfile.planAssignments || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/employees/:employeeId/profile/performance
export const getProfilePerformance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { employeeId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      throw new AppError(400, 'Invalid employee ID');
    }
    
    // This would integrate with your existing performance module
    // For now, return a basic structure
    const activeCycle = await PerformanceCycle.findOne({ status: 'ACTIVE' });
    const goals = activeCycle
      ? await Goal.find({ employeeId: new mongoose.Types.ObjectId(employeeId), cycleId: activeCycle._id }).lean()
      : [];
    
    res.json({
      success: true,
      data: {
        currentGoals: (goals || []).map((goal: any) => ({
          description: goal.description,
          status: goal.status,
          progress: goal.progress,
          targetDate: goal.targetDate,
        })),
        lastReview: null,
        lastRating: null,
        ratingScale: null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/employees/:employeeId/profile/career
export const getProfileCareer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { employeeId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      throw new AppError(400, 'Invalid employee ID');
    }
    
    const jobHistory = await EmployeeJobHistory.find({ employeeId })
      .sort({ startDate: -1 })
      .lean();
    
    res.json({
      success: true,
      data: {
        jobHistory: (jobHistory || []).map((job: any) => ({
          jobTitle: job.jobTitle,
          company: job.company,
          startDate: job.startDate,
          endDate: job.endDate,
          achievements: job.achievements,
          responsibilitiesText: job.responsibilitiesText,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/employees/:employeeId/profile/contact
export const getProfileContact = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { employeeId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      throw new AppError(400, 'Invalid employee ID');
    }
    
    const employee = await Employee.findById(employeeId)
      .populate('departmentId', 'name');
    
    if (!employee) {
      throw new AppError(404, 'Employee not found');
    }
    
    res.json({
      success: true,
      data: {
        workEmail: employee.email,
        workPhone: employee.phone,
        officeLocation: (employee.departmentId as any)?.name || 'N/A',
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/employees/:employeeId/profile/personal
export const getProfilePersonal = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { employeeId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      throw new AppError(400, 'Invalid employee ID');
    }
    
    const employee = await Employee.findById(employeeId);
    
    if (!employee) {
      throw new AppError(404, 'Employee not found');
    }
    
    res.json({
      success: true,
      data: {
        dateOfBirth: employee.dob,
        gender: null, // Can be extended
        maritalStatus: null, // Can be extended
        nic: null, // Can be extended
        nationality: null, // Can be extended
        emergencyContacts: [], // Can be extended
        personalEmail: null, // Can be extended
        personalPhone: employee.phone,
        address: employee.address,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/employees/:employeeId/profile/pay
export const getProfilePay = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { employeeId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      throw new AppError(400, 'Invalid employee ID');
    }
    
    // Get latest payroll entry for bank account info
    const latestPayroll = await PayrollEntry.findOne({ employeeId })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: {
        payGroup: 'DEFAULT', // Can be extended
        payFrequency: 'MONTHLY',
        payrollCurrency: 'LKR',
        bankAccounts: [
          {
            bankName: 'N/A',
            branch: 'N/A',
            accountNumber: 'N/A',
            isPrimary: true,
          },
        ],
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/employees/:employeeId/profile/absence
export const getProfileAbsence = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { employeeId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      throw new AppError(400, 'Invalid employee ID');
    }
    
    // Get leave types and calculate balances
    const leaveTypes = await LeaveType.find({});
    const leaveRequests = await LeaveRequest.find({ employeeId });
    
    const balances = await Promise.all(
      leaveTypes.map(async (leaveType) => {
        const requests = leaveRequests.filter(
          (req) => req.leaveTypeId.toString() === leaveType._id.toString()
        );
        
        const takenYTD = requests
          .filter((req) => {
            const year = new Date().getFullYear();
            const reqYear = new Date(req.startDate).getFullYear();
            return reqYear === year && req.status !== 'REJECTED' && req.status !== 'CANCELLED';
          })
          .reduce((sum, req) => sum + req.days, 0);
        
        return {
          plan: leaveType.name,
          unit: 'Days',
          beginningBalance: leaveType.entitlementDays || 0,
          accruedYTD: 0, // Can be calculated based on accrual rules
          takenYTD,
          carryOver: 0,
          forfeited: 0,
          balanceAsOfDate: new Date(),
          includesPendingApprovals: requests.some((req) => req.status === 'PENDING'),
        };
      })
    );
    
    res.json({
      success: true,
      data: {
        balances: balances || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/employees/:employeeId/profile/benefits
export const getProfileBenefits = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { employeeId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      throw new AppError(400, 'Invalid employee ID');
    }
    
    const benefits = await EmployeeBenefit.find({ employeeId })
      .sort({ effectiveDate: -1 })
      .lean();
    
    res.json({
      success: true,
      data: {
        benefits: (benefits || []).map((benefit: any) => ({
          benefitType: benefit.benefitType,
          planName: benefit.planName,
          provider: benefit.provider || 'N/A',
          effectiveDate: benefit.effectiveDate,
          status: benefit.status,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/employees/:employeeId/profile/service-dates
export const getProfileServiceDates = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { employeeId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      throw new AppError(400, 'Invalid employee ID');
    }
    
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      throw new AppError(404, 'Employee not found');
    }
    
    let serviceDates = await EmployeeServiceDates.findOne({ employeeId });
    
    // Create if doesn't exist
    if (!serviceDates) {
      serviceDates = await EmployeeServiceDates.create({
        employeeId,
        hireDate: employee.hireDate,
        originalHireDate: employee.hireDate,
        continuousServiceDate: employee.hireDate,
      });
    }
    
    const lengthOfService = calculateLengthOfService(serviceDates.hireDate);
    
    res.json({
      success: true,
      data: {
        hireDate: serviceDates.hireDate,
        originalHireDate: serviceDates.originalHireDate || serviceDates.hireDate,
        continuousServiceDate: serviceDates.continuousServiceDate || serviceDates.hireDate,
        benefitServiceDate: serviceDates.benefitServiceDate,
        companyServiceDate: serviceDates.companyServiceDate,
        seniorityDate: serviceDates.seniorityDate,
        unionSeniorityDate: serviceDates.unionSeniorityDate,
        probationEndDate: serviceDates.probationEndDate,
        lengthOfService,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/employees/:employeeId/profile/assigned-roles
export const getProfileAssignedRoles = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { employeeId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      throw new AppError(400, 'Invalid employee ID');
    }
    
    const roles = await EmployeeAssignedRole.find({ employeeId })
      .sort({ dateAssigned: -1 })
      .lean();
    
    res.json({
      success: true,
      data: {
        roles: (roles || []).map((role: any) => ({
          roleName: role.roleName,
          organizationName: role.organizationName,
          organizationType: role.organizationType,
          dateAssigned: role.dateAssigned,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/employees/:employeeId/profile/support-roles
export const getProfileSupportRoles = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { employeeId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      throw new AppError(400, 'Invalid employee ID');
    }
    
    const roles = await EmployeeSupportRole.find({ employeeId })
      .sort({ effectiveStartDate: -1 })
      .lean();
    
    res.json({
      success: true,
      data: {
        roles: (roles || []).map((role: any) => ({
          assignableRole: role.assignableRole,
          workerName: role.workerName,
          organization: role.organization,
          roleEnabledDescription: role.roleEnabledDescription || 'N/A',
          effectiveStartDate: role.effectiveStartDate,
          effectiveEndDate: role.effectiveEndDate,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/employees/:employeeId/profile/external-interactions
export const getProfileExternalInteractions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { employeeId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      throw new AppError(400, 'Invalid employee ID');
    }
    
    let interactions = await EmployeeExternalInteractions.findOne({ employeeId });
    
    if (!interactions) {
      interactions = await EmployeeExternalInteractions.create({
        employeeId,
        answers: {},
      });
    }
    
    res.json({
      success: true,
      data: {
        answers: interactions.answers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/employees/:employeeId/profile/additional-data
export const getProfileAdditionalData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { employeeId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      throw new AppError(400, 'Invalid employee ID');
    }
    
    let additionalData = await EmployeeAdditionalData.findOne({ employeeId });
    
    if (!additionalData) {
      additionalData = await EmployeeAdditionalData.create({
        employeeId,
        dataGroups: {},
      });
    }
    
    res.json({
      success: true,
      data: {
        dataGroups: additionalData.dataGroups,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/employees/:employeeId/profile/organizations
export const getProfileOrganizations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { employeeId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      throw new AppError(400, 'Invalid employee ID');
    }
    
    const organizations = await EmployeeOrganization.find({ employeeId })
      .lean();
    
    res.json({
      success: true,
      data: {
        organizations: (organizations || []).map((org: any) => ({
          organizationName: org.organizationName,
          organizationType: org.organizationType,
          organizationSubtype: org.organizationSubtype || 'N/A',
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/employees/:employeeId/profile/management-chain
export const getProfileManagementChain = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { employeeId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      throw new AppError(400, 'Invalid employee ID');
    }
    
    const chain: any[] = [];
    let currentEmployeeId: mongoose.Types.ObjectId | null = new mongoose.Types.ObjectId(employeeId);
    let levelIndex = 0;
    
    // Build chain by following manager relationships
    while (currentEmployeeId && levelIndex < 10) {
      const employee = await Employee.findById(currentEmployeeId)
        .populate('departmentId', 'name')
        .populate('managerId', 'firstName lastName employeeCode email phone');
      
      if (!employee) break;
      
      const manager = employee.managerId as any;
      if (!manager) break;
      
      chain.push({
        organizationName: (employee.departmentId as any)?.name || 'N/A',
        managerName: `${manager.firstName} ${manager.lastName}`,
        managerTitle: manager.grade || 'N/A',
        phoneNumber: manager.phone || 'N/A',
        levelIndex,
      });
      
      currentEmployeeId = manager._id;
      levelIndex++;
    }
    
    res.json({
      success: true,
      data: {
        chain: chain || [],
      },
    });
  } catch (error) {
    next(error);
  }
};
