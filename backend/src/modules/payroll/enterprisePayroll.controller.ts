import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AppError } from '../../middlewares/errorHandler';
import { Employee } from '../employees/employee.model';
import { EmployeeSalaryComponent } from './employeeSalaryComponent.model';
import { SalaryComponent } from './salaryComponent.model';
import { ApitTaxTable } from './apitTaxTable.model';
import { PayrollRun } from './payrollRun.model';
import { Payslip } from './payslip.model';
import {
  buildTotals,
  calculateSriLankaStatutory,
  CalculatedComponentLine,
  round2,
} from './statutoryCalculator.service';

function getAmountFromAssignment(
  assignment: any,
  component: any,
  resolvedMap: Map<string, number>
): number {
  const method = component.calculationMethod;
  if (method === 'fixed') {
    return Number(assignment.amount ?? component.defaultAmount ?? 0);
  }
  if (method === 'rate_x_units') {
    const rate = Number(assignment.rate ?? component.defaultRate ?? 0);
    const units = Number(assignment.units ?? 0);
    return rate * units;
  }
  const percentage = Number(assignment.percentage ?? component.defaultRate ?? 0);
  const baseCodes = (assignment.baseComponentCodes || component.baseComponentCodes || []) as string[];
  const baseTotal = baseCodes.reduce((sum, code) => sum + (resolvedMap.get(String(code).toUpperCase()) || 0), 0);
  return (baseTotal * percentage) / 100;
}

export const getSalaryComponents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { kind, isActive } = req.query;
    const query: any = {};
    if (kind) query.kind = kind;
    if (isActive !== undefined) query.isActive = String(isActive) === 'true';

    const components = await SalaryComponent.find(query).sort({ displayOrder: 1, name: 1 });
    res.json({ success: true, data: components });
  } catch (error) {
    next(error);
  }
};

export const createSalaryComponent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body;
    if (!payload.code || !payload.name || !payload.kind || !payload.calculationMethod) {
      throw new AppError(400, 'code, name, kind, and calculationMethod are required');
    }
    const component = await SalaryComponent.create({
      ...payload,
      code: String(payload.code).toUpperCase(),
    });
    res.status(201).json({ success: true, data: component });
  } catch (error) {
    next(error);
  }
};

export const getApitTable = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tableCode } = req.params;
    const { asOf } = req.query;
    const asOfDate = asOf ? new Date(String(asOf)) : new Date();
    const table = await ApitTaxTable.findOne({
      tableCode: String(tableCode).toUpperCase(),
      isActive: true,
      effectiveFrom: { $lte: asOfDate },
      $or: [{ effectiveTo: null }, { effectiveTo: { $exists: false } }, { effectiveTo: { $gte: asOfDate } }],
    }).sort({ effectiveFrom: -1 });
    if (!table) throw new AppError(404, 'APIT table not found');
    res.json({ success: true, data: table });
  } catch (error) {
    next(error);
  }
};

export const calculateEnterprisePayslip = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employeeId, payrollRunId, periodStart, periodEnd, apitTableCode = 'TABLE_01' } = req.body;
    if (!employeeId || !periodStart || !periodEnd) {
      throw new AppError(400, 'employeeId, periodStart, and periodEnd are required');
    }
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      throw new AppError(400, 'Invalid employee ID');
    }

    const employee = await Employee.findById(employeeId).lean();
    if (!employee) throw new AppError(404, 'Employee not found');

    const [apitTable, assignments] = await Promise.all([
      ApitTaxTable.findOne({
        tableCode: String(apitTableCode).toUpperCase(),
        isActive: true,
      }).sort({ effectiveFrom: -1 }),
      EmployeeSalaryComponent.find({
        employeeId,
        isActive: true,
        effectiveFrom: { $lte: new Date(periodEnd) },
        $or: [{ effectiveTo: null }, { effectiveTo: { $exists: false } }, { effectiveTo: { $gte: new Date(periodStart) } }],
      }).populate('salaryComponentId'),
    ]);

    if (!apitTable) throw new AppError(404, `APIT table ${apitTableCode} not found`);

    // Resolve components in display order; if % of base references earlier components, this keeps deterministic behavior.
    const sortedAssignments = assignments.sort((a: any, b: any) => {
      const aOrder = (a.salaryComponentId as any)?.displayOrder ?? 999;
      const bOrder = (b.salaryComponentId as any)?.displayOrder ?? 999;
      return aOrder - bOrder;
    });

    const resolvedMap = new Map<string, number>();
    const lines: CalculatedComponentLine[] = [];

    for (const assignment of sortedAssignments) {
      const component: any = assignment.salaryComponentId;
      if (!component || !component.isActive) continue;
      const rawAmount = getAmountFromAssignment(assignment, component, resolvedMap);
      const amount = round2(Math.max(0, rawAmount));
      const code = String(component.code).toUpperCase();
      resolvedMap.set(code, amount);
      lines.push({
        code,
        label: component.name,
        kind: component.kind,
        amount,
        taxable: Boolean(component.taxable),
        epfEtfEligible: Boolean(component.epfEtfEligible),
        isRecovery: Boolean(component.isRecovery),
        displayOrder: Number(component.displayOrder ?? 100),
      });
    }

    const statutory = calculateSriLankaStatutory(lines, apitTable.slabs);
    const totals = buildTotals(lines, statutory);

    const deductionsWithStatutory = [
      ...lines.filter((l) => l.kind === 'deduction'),
      {
        code: 'EPF_EMPLOYEE',
        label: 'EPF (Employee 8%)',
        kind: 'deduction' as const,
        amount: statutory.epfEmployee,
        taxable: false,
        epfEtfEligible: false,
        isRecovery: false,
        displayOrder: 900,
      },
      {
        code: 'APIT',
        label: `APIT (${apitTable.tableCode})`,
        kind: 'deduction' as const,
        amount: statutory.apit,
        taxable: false,
        epfEtfEligible: false,
        isRecovery: false,
        displayOrder: 910,
      },
    ];

    const employerContributionLines = [
      ...lines.filter((l) => l.kind === 'employer_contribution'),
      {
        code: 'EPF_EMPLOYER',
        label: 'EPF (Employer 12%)',
        kind: 'employer_contribution' as const,
        amount: statutory.epfEmployer,
        taxable: false,
        epfEtfEligible: false,
        isRecovery: false,
        displayOrder: 920,
      },
      {
        code: 'ETF_EMPLOYER',
        label: 'ETF (Employer 3%)',
        kind: 'employer_contribution' as const,
        amount: statutory.etfEmployer,
        taxable: false,
        epfEtfEligible: false,
        isRecovery: false,
        displayOrder: 930,
      },
    ];

    let savedPayslip: any;
    if (payrollRunId) {
      if (!mongoose.Types.ObjectId.isValid(payrollRunId)) {
        throw new AppError(400, 'Invalid payrollRunId');
      }
      const run = await PayrollRun.findById(payrollRunId);
      if (!run) throw new AppError(404, 'Payroll run not found');

      savedPayslip = await Payslip.findOneAndUpdate(
        { payrollRunId, employeeId },
        {
          payrollRunId,
          employeeId,
          periodStart: new Date(periodStart),
          periodEnd: new Date(periodEnd),
          lines: [...lines, ...deductionsWithStatutory.filter((l) => ['EPF_EMPLOYEE', 'APIT'].includes(l.code)), ...employerContributionLines.filter((l) => ['EPF_EMPLOYER', 'ETF_EMPLOYER'].includes(l.code))],
          totals: {
            ...totals,
            epfEmployee: statutory.epfEmployee,
            epfEmployer: statutory.epfEmployer,
            etfEmployer: statutory.etfEmployer,
            apit: statutory.apit,
            epfEtfEligibleEarnings: statutory.epfEtfEligibleEarnings,
            taxableEarnings: statutory.taxableEarnings,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    res.json({
      success: true,
      data: {
        employee: {
          id: employee._id.toString(),
          empNo: employee.empNo || employee.employeeNumber,
          empCode: employee.employeeCode,
          name: employee.fullName || `${employee.firstName || ''} ${employee.lastName || ''}`.trim(),
        },
        periodStart,
        periodEnd,
        apitTableCode: apitTable.tableCode,
        earnings: lines.filter((l) => l.kind === 'earning').sort((a, b) => a.displayOrder - b.displayOrder),
        deductions: deductionsWithStatutory.sort((a, b) => a.displayOrder - b.displayOrder),
        employerContributions: employerContributionLines.sort((a, b) => a.displayOrder - b.displayOrder),
        totals: {
          ...totals,
          epfEmployee: statutory.epfEmployee,
          epfEmployer: statutory.epfEmployer,
          etfEmployer: statutory.etfEmployer,
          apit: statutory.apit,
          epfEtfEligibleEarnings: statutory.epfEtfEligibleEarnings,
          taxableEarnings: statutory.taxableEarnings,
        },
        payslipId: savedPayslip?._id?.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};
