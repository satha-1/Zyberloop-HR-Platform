import { connectDatabase } from '../connection';
import { SalaryComponent } from '../../modules/payroll/salaryComponent.model';
import { ApitTaxTable } from '../../modules/payroll/apitTaxTable.model';

async function runMigration() {
  await connectDatabase();

  const salaryComponents = [
    // Earnings (EPF/ETF eligible)
    { code: 'BASIC', name: 'Basic Salary', kind: 'earning', taxable: true, epfEtfEligible: true, calculationMethod: 'fixed', displayOrder: 10, isSystem: true },
    { code: 'COLA', name: 'COLA Allowance', kind: 'earning', taxable: true, epfEtfEligible: true, calculationMethod: 'fixed', displayOrder: 20, isSystem: true },
    { code: 'FOOD', name: 'Food Allowance', kind: 'earning', taxable: true, epfEtfEligible: true, calculationMethod: 'fixed', displayOrder: 30 },
    { code: 'COMMISSION', name: 'Commission', kind: 'earning', taxable: true, epfEtfEligible: true, calculationMethod: 'fixed', displayOrder: 40 },
    { code: 'PIECE_RATE', name: 'Piece-rate / Contract Basis Pay', kind: 'earning', taxable: true, epfEtfEligible: true, calculationMethod: 'fixed', displayOrder: 50 },

    // Earnings excluded from EPF/ETF
    { code: 'OVERTIME', name: 'Overtime', kind: 'earning', taxable: true, epfEtfEligible: false, calculationMethod: 'rate_x_units', displayOrder: 100 },
    { code: 'BONUS', name: 'Bonus / Incentive', kind: 'earning', taxable: true, epfEtfEligible: false, calculationMethod: 'fixed', displayOrder: 110 },
    { code: 'REIM_TRAVEL', name: 'Travel Reimbursement', kind: 'earning', taxable: false, epfEtfEligible: false, calculationMethod: 'fixed', displayOrder: 120 },

    // Recoveries / deductions
    { code: 'LOAN_RECOVERY', name: 'Loan Recovery', kind: 'deduction', taxable: false, epfEtfEligible: false, calculationMethod: 'fixed', displayOrder: 210, isRecovery: true },
    { code: 'ADV_RECOVERY', name: 'Salary Advance Recovery', kind: 'deduction', taxable: false, epfEtfEligible: false, calculationMethod: 'fixed', displayOrder: 220, isRecovery: true },
    { code: 'COMM_ADV_RECOVERY', name: 'Commission Advance Recovery', kind: 'deduction', taxable: false, epfEtfEligible: false, calculationMethod: 'fixed', displayOrder: 230, isRecovery: true },
  ];

  for (const c of salaryComponents) {
    await SalaryComponent.findOneAndUpdate(
      { code: c.code },
      { $set: { ...c, isActive: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  // Table-driven APIT Table 01 seed (example starter table, can be adjusted by payroll admins)
  await ApitTaxTable.findOneAndUpdate(
    { tableCode: 'TABLE_01', effectiveFrom: new Date('2025-04-01') },
    {
      $set: {
        tableCode: 'TABLE_01',
        name: 'Sri Lanka APIT Table 01',
        currency: 'LKR',
        effectiveFrom: new Date('2025-04-01'),
        isActive: true,
        notes: 'Starter slab set. Update according to IRD gazette revisions.',
        slabs: [
          { minMonthlyIncome: 0, maxMonthlyIncome: 100000, fixedTax: 0, ratePercent: 0 },
          { minMonthlyIncome: 100000, maxMonthlyIncome: 141667, fixedTax: 0, ratePercent: 6 },
          { minMonthlyIncome: 141667, maxMonthlyIncome: 183333, fixedTax: 2500, ratePercent: 12 },
          { minMonthlyIncome: 183333, maxMonthlyIncome: 225000, fixedTax: 7500, ratePercent: 18 },
          { minMonthlyIncome: 225000, maxMonthlyIncome: 266667, fixedTax: 15000, ratePercent: 24 },
          { minMonthlyIncome: 266667, maxMonthlyIncome: 308333, fixedTax: 25000, ratePercent: 30 },
          { minMonthlyIncome: 308333, fixedTax: 37500, ratePercent: 36 },
        ],
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log('✅ Migration complete: enterprise payroll identifiers + components + APIT table seed');
  process.exit(0);
}

runMigration().catch((error) => {
  console.error('❌ Migration failed', error);
  process.exit(1);
});
