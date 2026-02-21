/**
 * Example usage of the Payslip Calculator
 * 
 * This file demonstrates how to use the payslip calculator service.
 * You can use this as a reference for testing or integration.
 */

import { calculatePayslip } from './payslipCalculator.service';

// Example input matching the specification
const exampleInput = {
  employee: {
    id: "EMP001",
    name: "Alice Kumar",
    designation: "Software Engineer",
    department: "Engineering",
    joining_date: "2023-05-10"
  },
  pay_period: {
    month: 3,
    year: 2025,
    start_date: "2025-03-01",
    end_date: "2025-03-31",
    total_working_days: 22,
    present_days: 21,
    leave_without_pay_days: 1
  },
  salary_structure: {
    currency: "INR",
    basic: 50000,
    hra: 20000,
    conveyance_allowance: 3000,
    special_allowance: 7000,
    other_allowances: 0,
    ctc_per_month: 80000
  },
  earnings_adjustments: {
    overtime_hours: 5,
    overtime_rate_per_hour: 500,
    bonus: 10000,
    incentives: 0
  },
  deductions_config: {
    tax_tds: 8000,
    pf_employee: 1800,
    esi_employee: 0,
    professional_tax: 200,
    other_deductions: 0,
    loan_repayment: 0
  },
  company: {
    name: "Example Tech Pvt Ltd",
    address_line1: "123, MG Road",
    address_line2: "Bangalore, Karnataka",
    pincode: "560001",
    pan_or_tax_id: "ABCDE1234F"
  }
};

// Calculate payslip
const result = calculatePayslip(exampleInput);

// Output the result
console.log(JSON.stringify(result, null, 2));

/**
 * Expected calculation breakdown:
 * 
 * Daily rates:
 * - daily_basic = 50000 / 22 = 2272.73
 * - daily_hra = 20000 / 22 = 909.09
 * - daily_conveyance = 3000 / 22 = 136.36
 * - daily_special = 7000 / 22 = 318.18
 * 
 * LWP deductions (1 day):
 * - lwp_basic = 2272.73
 * - lwp_hra = 909.09
 * - lwp_conveyance = 136.36
 * - lwp_special = 318.18
 * 
 * Earned amounts:
 * - basic_earned = 50000 - 2272.73 = 47727.27
 * - hra_earned = 20000 - 909.09 = 19090.91
 * - conveyance_earned = 3000 - 136.36 = 2863.64
 * - special_earned = 7000 - 318.18 = 6681.82
 * 
 * Variable earnings:
 * - overtime_earning = 5 * 500 = 2500
 * - bonus = 10000
 * - incentives = 0
 * 
 * Gross earnings:
 * - gross = 47727.27 + 19090.91 + 2863.64 + 6681.82 + 2500 + 10000 = 90863.64
 * 
 * Deductions:
 * - total_deductions = 8000 + 1800 + 0 + 200 + 0 + 0 = 10000
 * 
 * Net pay:
 * - net = 90863.64 - 10000 = 80863.64
 */
