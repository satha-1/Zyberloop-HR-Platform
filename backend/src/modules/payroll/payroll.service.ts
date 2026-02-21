import { Employee } from '../employees/employee.model';
import { PayrollRun, IPayrollRun } from './payrollRun.model';
import { PayrollEntry } from './payrollEntry.model';

// Config-driven rates (should come from system_config in production)
const EPF_EMPLOYEE_RATE = 0.08; // 8%
const EPF_EMPLOYER_RATE = 0.12; // 12%
const ETF_EMPLOYER_RATE = 0.03; // 3%

// Tax brackets (Sri Lanka - should be config-driven)
const TAX_BRACKETS = [
  { min: 0, max: 100000, rate: 0 },
  { min: 100000, max: 141667, rate: 0.06 },
  { min: 141667, max: 183333, rate: 0.12 },
  { min: 183333, max: 225000, rate: 0.18 },
  { min: 225000, max: Infinity, rate: 0.24 },
];

export const calculatePayroll = async (payrollRunId: string): Promise<void> => {
  const payrollRun = await PayrollRun.findById(payrollRunId);
  if (!payrollRun) {
    throw new Error('Payroll run not found');
  }

  // Get all active employees
  const employees = await Employee.find({ status: 'active' });

  let totalGross = 0;
  let totalNet = 0;
  const entries = [];

  for (const employee of employees) {
    // Calculate basic salary (prorate for joiners/resignees)
    const basicSalary = employee.salary;
    
    // Calculate allowances (20% housing, 500 transport - config-driven)
    const housingAllowance = basicSalary * 0.2;
    const transportAllowance = 500;
    
    const gross = basicSalary + housingAllowance + transportAllowance;

    // Calculate EPF
    const epfEmployee = gross * EPF_EMPLOYEE_RATE;
    const epFEmployer = gross * EPF_EMPLOYER_RATE;
    const etfEmployer = gross * ETF_EMPLOYER_RATE;

    // Calculate tax
    const taxableIncome = gross - epfEmployee;
    let tax = 0;
    for (const bracket of TAX_BRACKETS) {
      if (taxableIncome > bracket.min) {
        const taxableInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
        tax += taxableInBracket * bracket.rate;
      }
    }

    const totalDeductions = epfEmployee + tax;
    const net = gross - totalDeductions;

    totalGross += gross;
    totalNet += net;

    const entry = new PayrollEntry({
      payrollRunId,
      employeeId: employee._id,
      components: [
        { name: 'Base Salary', type: 'EARNING', amount: basicSalary },
        { name: 'Housing Allowance', type: 'EARNING', amount: housingAllowance },
        { name: 'Transport Allowance', type: 'EARNING', amount: transportAllowance },
        { name: 'EPF (Employee)', type: 'DEDUCTION', amount: epfEmployee },
        { name: 'Income Tax', type: 'DEDUCTION', amount: tax },
      ],
      gross,
      statutoryDeductions: {
        epfEmployee,
        epfEmployer: epFEmployer,
        etfEmployer,
        tax,
      },
      otherDeductions: 0,
      net,
      arrears: 0,
    });

    entries.push(entry);
  }

  // Save all entries
  await PayrollEntry.insertMany(entries);

  // Update payroll run
  payrollRun.totalGross = totalGross;
  payrollRun.totalNet = totalNet;
  payrollRun.employeeCount = employees.length;
  payrollRun.status = 'CALCULATED';
  await payrollRun.save();
};
