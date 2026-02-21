/**
 * Payroll & Payslip Calculator Service
 * 
 * Takes structured input about an employee, their role, and payroll configuration,
 * calculates their salary for a given pay period, and returns a structured payslip JSON.
 */

interface EmployeeInput {
  id: string;
  name: string;
  designation?: string;
  department?: string;
  joining_date?: string;
}

interface PayPeriodInput {
  month: number;
  year: number;
  start_date: string;
  end_date: string;
  total_working_days: number;
  present_days: number;
  leave_without_pay_days?: number;
}

interface SalaryStructureInput {
  currency?: string;
  basic: number;
  hra?: number;
  conveyance_allowance?: number;
  special_allowance?: number;
  other_allowances?: number;
  ctc_per_month?: number;
}

interface EarningsAdjustmentsInput {
  overtime_hours?: number;
  overtime_rate_per_hour?: number;
  bonus?: number;
  incentives?: number;
}

interface DeductionsConfigInput {
  tax_tds?: number;
  pf_employee?: number;
  esi_employee?: number;
  professional_tax?: number;
  other_deductions?: number;
  loan_repayment?: number;
}

interface CompanyInput {
  name?: string;
  address_line1?: string;
  address_line2?: string;
  pincode?: string;
  pan_or_tax_id?: string;
}

interface PayslipCalculationInput {
  employee: EmployeeInput;
  pay_period: PayPeriodInput;
  salary_structure: SalaryStructureInput;
  earnings_adjustments?: EarningsAdjustmentsInput;
  deductions_config?: DeductionsConfigInput;
  company?: CompanyInput;
}

interface PayslipOutput {
  payslip: {
    employee: EmployeeInput;
    company: CompanyInput;
    pay_period: PayPeriodInput;
    earnings_breakup: {
      currency: string;
      basic_earned: number;
      hra_earned: number;
      conveyance_earned: number;
      special_earned: number;
      other_allowances_earned: number;
      bonus: number;
      incentives: number;
      overtime_hours: number;
      overtime_rate_per_hour: number;
      overtime_earning: number;
      gross_earnings: number;
    };
    deductions_breakup: {
      tax_tds: number;
      pf_employee: number;
      esi_employee: number;
      professional_tax: number;
      other_deductions: number;
      loan_repayment: number;
      total_deductions: number;
    };
    net_pay: {
      amount: number;
      amount_in_words: string;
      currency: string;
    };
    calculation_notes: string[];
    generated_metadata: {
      generated_on_iso: string | null;
      generated_by: string;
    };
  };
}

/**
 * Convert number to words (Indian numbering system)
 */
function numberToWords(num: number): string {
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  if (num === 0) return 'Zero';

  // Handle decimal part (paise)
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  let words = '';

  // Helper function to convert hundreds
  function convertHundreds(n: number): string {
    let result = '';

    // Hundreds
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' Hundred ';
      n = n % 100;
    }

    // Tens and Ones
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + ' ';
      n = n % 10;
    }

    if (n > 0) {
      result += ones[n] + ' ';
    }

    return result.trim();
  }

  // Convert rupees
  if (rupees > 0) {
    let remaining = rupees;

    // Crores
    if (remaining >= 10000000) {
      const crores = Math.floor(remaining / 10000000);
      words += convertHundreds(crores) + ' Crore ';
      remaining = remaining % 10000000;
    }

    // Lakhs
    if (remaining >= 100000) {
      const lakhs = Math.floor(remaining / 100000);
      words += convertHundreds(lakhs) + ' Lakh ';
      remaining = remaining % 100000;
    }

    // Thousands
    if (remaining >= 1000) {
      const thousands = Math.floor(remaining / 1000);
      words += convertHundreds(thousands) + ' Thousand ';
      remaining = remaining % 1000;
    }

    // Hundreds, Tens, Ones
    if (remaining > 0) {
      words += convertHundreds(remaining);
    }

    words = words.trim();

    // Add currency name
    words += ' Rupees';

    // Handle paise
    if (paise > 0) {
      words += ` and ${convertHundreds(paise)} Paise`;
    }

    words += ' Only';
  } else if (paise > 0) {
    words = `${convertHundreds(paise)} Paise Only`;
  }

  return words.trim();
}

/**
 * Round to 2 decimal places
 */
function roundToTwoDecimals(num: number): number {
  return Math.round(num * 100) / 100;
}

/**
 * Calculate payslip from structured input
 */
export function calculatePayslip(input: PayslipCalculationInput): PayslipOutput {
  const notes: string[] = [];
  const currency = input.salary_structure.currency || 'INR';

  // Extract values with defaults
  const basic = input.salary_structure.basic || 0;
  const hra = input.salary_structure.hra || 0;
  const conveyanceAllowance = input.salary_structure.conveyance_allowance || 0;
  const specialAllowance = input.salary_structure.special_allowance || 0;
  const otherAllowances = input.salary_structure.other_allowances || 0;

  const totalWorkingDays = input.pay_period.total_working_days || 0;
  const leaveWithoutPayDays = input.pay_period.leave_without_pay_days || 0;

  // Validate inputs
  if (totalWorkingDays <= 0) {
    notes.push('Warning: total_working_days is 0 or negative. Using default calculation.');
  }

  // Calculate daily rates
  const dailyBasic = totalWorkingDays > 0 ? basic / totalWorkingDays : 0;
  const dailyHra = totalWorkingDays > 0 ? hra / totalWorkingDays : 0;
  const dailyConveyance = totalWorkingDays > 0 ? conveyanceAllowance / totalWorkingDays : 0;
  const dailySpecial = totalWorkingDays > 0 ? specialAllowance / totalWorkingDays : 0;
  const dailyOtherAllowances = totalWorkingDays > 0 ? otherAllowances / totalWorkingDays : 0;

  // Calculate LWP deductions
  const lwpBasicDeduction = roundToTwoDecimals(dailyBasic * leaveWithoutPayDays);
  const lwpHraDeduction = roundToTwoDecimals(dailyHra * leaveWithoutPayDays);
  const lwpConveyanceDeduction = roundToTwoDecimals(dailyConveyance * leaveWithoutPayDays);
  const lwpSpecialDeduction = roundToTwoDecimals(dailySpecial * leaveWithoutPayDays);
  const lwpOtherAllowancesDeduction = roundToTwoDecimals(dailyOtherAllowances * leaveWithoutPayDays);

  if (leaveWithoutPayDays > 0) {
    notes.push(`Leave without pay deduction applied for ${leaveWithoutPayDays} day(s).`);
  }

  // Calculate earned amounts (after LWP)
  const basicEarned = roundToTwoDecimals(basic - lwpBasicDeduction);
  const hraEarned = roundToTwoDecimals(hra - lwpHraDeduction);
  const conveyanceEarned = roundToTwoDecimals(conveyanceAllowance - lwpConveyanceDeduction);
  const specialEarned = roundToTwoDecimals(specialAllowance - lwpSpecialDeduction);
  const otherAllowancesEarned = roundToTwoDecimals(otherAllowances - lwpOtherAllowancesDeduction);

  // Handle earnings adjustments
  const earningsAdjustments = input.earnings_adjustments || {};
  const overtimeHours = earningsAdjustments.overtime_hours || 0;
  const overtimeRatePerHour = earningsAdjustments.overtime_rate_per_hour || 0;
  const overtimeEarning = roundToTwoDecimals(overtimeHours * overtimeRatePerHour);
  const bonus = roundToTwoDecimals(earningsAdjustments.bonus || 0);
  const incentives = roundToTwoDecimals(earningsAdjustments.incentives || 0);
  const totalVariableEarning = roundToTwoDecimals(bonus + incentives + overtimeEarning);

  // Calculate gross earnings
  const grossEarnings = roundToTwoDecimals(
    basicEarned +
    hraEarned +
    conveyanceEarned +
    specialEarned +
    otherAllowancesEarned +
    totalVariableEarning
  );

  // Handle deductions
  const deductionsConfig = input.deductions_config || {};
  const taxTds = roundToTwoDecimals(deductionsConfig.tax_tds || 0);
  const pfEmployee = roundToTwoDecimals(deductionsConfig.pf_employee || 0);
  const esiEmployee = roundToTwoDecimals(deductionsConfig.esi_employee || 0);
  const professionalTax = roundToTwoDecimals(deductionsConfig.professional_tax || 0);
  const otherDeductions = roundToTwoDecimals(deductionsConfig.other_deductions || 0);
  const loanRepayment = roundToTwoDecimals(deductionsConfig.loan_repayment || 0);

  const totalDeductions = roundToTwoDecimals(
    taxTds +
    pfEmployee +
    esiEmployee +
    professionalTax +
    otherDeductions +
    loanRepayment
  );

  // Calculate net pay
  const netPay = roundToTwoDecimals(grossEarnings - totalDeductions);

  // Generate amount in words
  const amountInWords = numberToWords(netPay);

  // Add calculation notes
  if (basic === 0) {
    notes.push('Warning: Basic salary is 0. Please verify salary structure.');
  }

  if (netPay < 0) {
    notes.push('Warning: Net pay is negative. Please review deductions.');
  }

  if (!input.company?.name) {
    notes.push('Company information is missing.');
  }

  // Generate metadata
  const generatedOnIso = new Date().toISOString();

  return {
    payslip: {
      employee: {
        id: input.employee.id,
        name: input.employee.name,
        designation: input.employee.designation || null,
        department: input.employee.department || null,
        joining_date: input.employee.joining_date || null,
      },
      company: {
        name: input.company?.name || null,
        address_line1: input.company?.address_line1 || null,
        address_line2: input.company?.address_line2 || null,
        pincode: input.company?.pincode || null,
        pan_or_tax_id: input.company?.pan_or_tax_id || null,
      },
      pay_period: {
        month: input.pay_period.month,
        year: input.pay_period.year,
        start_date: input.pay_period.start_date,
        end_date: input.pay_period.end_date,
        total_working_days: input.pay_period.total_working_days,
        present_days: input.pay_period.present_days,
        leave_without_pay_days: leaveWithoutPayDays,
      },
      earnings_breakup: {
        currency,
        basic_earned: basicEarned,
        hra_earned: hraEarned,
        conveyance_earned: conveyanceEarned,
        special_earned: specialEarned,
        other_allowances_earned: otherAllowancesEarned,
        bonus,
        incentives,
        overtime_hours: overtimeHours,
        overtime_rate_per_hour: overtimeRatePerHour,
        overtime_earning: overtimeEarning,
        gross_earnings: grossEarnings,
      },
      deductions_breakup: {
        tax_tds: taxTds,
        pf_employee: pfEmployee,
        esi_employee: esiEmployee,
        professional_tax: professionalTax,
        other_deductions: otherDeductions,
        loan_repayment: loanRepayment,
        total_deductions: totalDeductions,
      },
      net_pay: {
        amount: netPay,
        amount_in_words: amountInWords,
        currency,
      },
      calculation_notes: notes,
      generated_metadata: {
        generated_on_iso: generatedOnIso,
        generated_by: 'payroll-llm-v1',
      },
    },
  };
}

/**
 * Calculate payslip from JSON input string
 */
export function calculatePayslipFromJSON(jsonInput: string): PayslipOutput {
  try {
    const input = JSON.parse(jsonInput);
    return calculatePayslip(input);
  } catch (error) {
    throw new Error(`Invalid JSON input: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
