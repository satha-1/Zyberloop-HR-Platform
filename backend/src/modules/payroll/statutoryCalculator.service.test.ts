import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTotals,
  calculateApitFromSlabs,
  calculateSriLankaStatutory,
  CalculatedComponentLine,
} from './statutoryCalculator.service';

const table01 = [
  { minMonthlyIncome: 0, maxMonthlyIncome: 100000, fixedTax: 0, ratePercent: 0 },
  { minMonthlyIncome: 100000, maxMonthlyIncome: 141667, fixedTax: 0, ratePercent: 6 },
  { minMonthlyIncome: 141667, maxMonthlyIncome: 183333, fixedTax: 2500, ratePercent: 12 },
];

test('EPF/ETF base includes and excludes expected earnings', () => {
  const lines: CalculatedComponentLine[] = [
    { code: 'BASIC', label: 'Basic', kind: 'earning', amount: 100000, taxable: true, epfEtfEligible: true, isRecovery: false, displayOrder: 1 },
    { code: 'COLA', label: 'COLA', kind: 'earning', amount: 10000, taxable: true, epfEtfEligible: true, isRecovery: false, displayOrder: 2 },
    { code: 'OT', label: 'OT', kind: 'earning', amount: 5000, taxable: true, epfEtfEligible: false, isRecovery: false, displayOrder: 3 },
    { code: 'TR', label: 'Travel Reimb', kind: 'earning', amount: 4000, taxable: false, epfEtfEligible: false, isRecovery: false, displayOrder: 4 },
    { code: 'BON', label: 'Bonus', kind: 'earning', amount: 7000, taxable: true, epfEtfEligible: false, isRecovery: false, displayOrder: 5 },
  ];
  const statutory = calculateSriLankaStatutory(lines, table01);
  assert.equal(statutory.epfEtfEligibleEarnings, 110000);
  assert.equal(statutory.epfEmployee, 8800);
  assert.equal(statutory.epfEmployer, 13200);
  assert.equal(statutory.etfEmployer, 3300);
});

test('APIT threshold edge cases using table-driven slabs', () => {
  assert.equal(calculateApitFromSlabs(100000, table01), 0);
  assert.equal(calculateApitFromSlabs(100001, table01), 0.06);
  assert.equal(calculateApitFromSlabs(141667, table01), 2500.02);
});

test('Payslip totals reconcile: earnings - deductions = net pay', () => {
  const lines: CalculatedComponentLine[] = [
    { code: 'BASIC', label: 'Basic', kind: 'earning', amount: 200000, taxable: true, epfEtfEligible: true, isRecovery: false, displayOrder: 1 },
    { code: 'LOAN_RECOVERY', label: 'Loan', kind: 'deduction', amount: 10000, taxable: false, epfEtfEligible: false, isRecovery: true, displayOrder: 2 },
  ];
  const statutory = calculateSriLankaStatutory(lines, table01);
  const totals = buildTotals(lines, statutory);
  assert.equal(totals.netPay, totals.earnings - totals.deductions);
});
