import { Employee } from '../../employees/employee.model';
import { PayrollRun } from '../../payroll/payrollRun.model';
import { PayrollEntry } from '../../payroll/payrollEntry.model';
import { Department } from '../../departments/department.model';
import mongoose from 'mongoose';
import crypto from 'crypto';

export type SubjectType = 'EMPLOYEE' | 'CANDIDATE' | 'PAYROLL_RUN' | 'TERMINATION_CASE';
export type DocType = 'OFFER_LETTER' | 'APPOINTMENT_LETTER' | 'PAYSLIP' | 'FINAL_SETTLEMENT' | 'EXPERIENCE_CERT';

export interface MergeContext {
  employee?: any;
  company?: any;
  job?: any;
  payroll?: {
    totals: {
      gross: number;
      net: number;
      deductions: number;
    };
    lineItems: {
      earnings: Array<{ name: string; amount: number }>;
      deductions: Array<{ name: string; amount: number }>;
    };
    period: {
      start: Date;
      end: Date;
    };
    statutory?: {
      epfEmployee: number;
      epfEmployer: number;
      etfEmployer: number;
      tax: number;
    };
  };
  termination?: any;
  [key: string]: any;
}

class MergeContextResolverService {
  /**
   * Build context for document generation
   */
  async resolveContext(
    docType: DocType,
    subjectType: SubjectType,
    subjectId: string | mongoose.Types.ObjectId,
    effectiveOn?: Date
  ): Promise<{ context: MergeContext; contextHash: string }> {
    const context: MergeContext = {};

    // Add company info (static for now, could come from config)
    context.company = {
      name: 'ZyberHR',
      address: 'Colombo, Sri Lanka',
      phone: '+94 11 123 4567',
      email: 'info@zyberhr.com',
    };

    switch (subjectType) {
      case 'EMPLOYEE':
        await this.resolveEmployeeContext(context, subjectId, docType, effectiveOn);
        break;
      case 'PAYROLL_RUN':
        await this.resolvePayrollRunContext(context, subjectId, effectiveOn);
        break;
      case 'CANDIDATE':
        // TODO: Implement candidate context when recruitment module is ready
        context.candidate = { id: subjectId };
        break;
      case 'TERMINATION_CASE':
        // TODO: Implement termination context
        context.termination = { id: subjectId };
        break;
    }

    // Compute stable hash of context
    const contextJson = JSON.stringify(context, (key, value) => {
      // Sort object keys for consistent hashing
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        return Object.keys(value)
          .sort()
          .reduce((sorted: any, k) => {
            sorted[k] = value[k];
            return sorted;
          }, {});
      }
      return value;
    });
    const contextHash = crypto.createHash('sha256').update(contextJson).digest('hex');

    return { context, contextHash };
  }

  private async resolveEmployeeContext(
    context: MergeContext,
    employeeId: string | mongoose.Types.ObjectId,
    docType: DocType,
    effectiveOn?: Date
  ): Promise<void> {
    const employee = await Employee.findById(employeeId)
      .populate('departmentId', 'name code')
      .populate('managerId', 'firstName lastName email employeeCode');

    if (!employee) {
      throw new Error('Employee not found');
    }

    const department = employee.departmentId as any;
    const manager = employee.managerId as any;

    context.employee = {
      id: employee._id.toString(),
      employeeCode: employee.employeeCode,
      firstName: employee.firstName,
      lastName: employee.lastName,
      fullName: `${employee.firstName} ${employee.lastName}`,
      email: employee.email,
      phone: employee.phone,
      dob: employee.dob,
      address: employee.address,
      grade: employee.grade,
      hireDate: employee.hireDate,
      terminationDate: employee.terminationDate,
      status: employee.status,
      salary: employee.salary,
      department: department ? {
        id: department._id.toString(),
        name: department.name,
        code: department.code,
      } : null,
      manager: manager ? {
        id: manager._id.toString(),
        name: `${manager.firstName} ${manager.lastName}`,
        email: manager.email,
        employeeCode: manager.employeeCode,
      } : null,
    };

    // For payslips, add payroll data
    if (docType === 'PAYSLIP' && effectiveOn) {
      await this.addPayrollDataToContext(context, employeeId, effectiveOn);
    }
  }

  private async resolvePayrollRunContext(
    context: MergeContext,
    payrollRunId: string | mongoose.Types.ObjectId,
    effectiveOn?: Date
  ): Promise<void> {
    const payrollRun = await PayrollRun.findById(payrollRunId);
    if (!payrollRun) {
      throw new Error('Payroll run not found');
    }

    context.payroll = {
      totals: {
        gross: payrollRun.totalGross || 0,
        net: payrollRun.totalNet || 0,
        deductions: (payrollRun.totalGross || 0) - (payrollRun.totalNet || 0),
      },
      lineItems: {
        earnings: [],
        deductions: [],
      },
      period: {
        start: payrollRun.periodStart,
        end: payrollRun.periodEnd,
      },
    };
  }

  private async addPayrollDataToContext(
    context: MergeContext,
    employeeId: string | mongoose.Types.ObjectId,
    effectiveOn: Date
  ): Promise<void> {
    // Find payroll entry for this employee and period
    const payrollRun = await PayrollRun.findOne({
      periodStart: { $lte: effectiveOn },
      periodEnd: { $gte: effectiveOn },
      status: { $in: ['CALCULATED', 'HR_APPROVED', 'FINANCE_APPROVED', 'FINALIZED'] },
    }).sort({ createdAt: -1 });

    if (!payrollRun) {
      // No payroll data available
      return;
    }

    const entry = await PayrollEntry.findOne({
      payrollRunId: payrollRun._id,
      employeeId,
    });

    if (!entry) {
      return;
    }

    const earnings: Array<{ name: string; amount: number }> = [];
    const deductions: Array<{ name: string; amount: number }> = [];

    entry.components.forEach((comp: any) => {
      if (comp.type === 'EARNING') {
        earnings.push({ name: comp.name, amount: comp.amount });
      } else {
        deductions.push({ name: comp.name, amount: comp.amount });
      }
    });

    context.payroll = {
      totals: {
        gross: entry.gross,
        net: entry.net,
        deductions: entry.gross - entry.net,
      },
      lineItems: {
        earnings,
        deductions,
      },
      period: {
        start: payrollRun.periodStart,
        end: payrollRun.periodEnd,
      },
      statutory: {
        epfEmployee: entry.statutoryDeductions?.epfEmployee || 0,
        epfEmployer: entry.statutoryDeductions?.epfEmployer || 0,
        etfEmployer: entry.statutoryDeductions?.etfEmployer || 0,
        tax: entry.statutoryDeductions?.tax || 0,
      },
    };
  }

  /**
   * Validate context against template schema and strip unauthorized fields
   */
  validateAndSanitizeContext(context: MergeContext, variablesSchema: Record<string, any>): MergeContext {
    // For now, return context as-is
    // In production, implement schema validation and field whitelisting
    return context;
  }
}

export const mergeContextResolver = new MergeContextResolverService();
