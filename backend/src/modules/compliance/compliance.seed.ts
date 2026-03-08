import { ComplianceFilingType } from './compliance.model';

/**
 * Seed default compliance filing types for Sri Lanka (EPF, ETF)
 */
export async function seedComplianceFilingTypes() {
  try {
    // Check if types already exist
    const existingEPF = await ComplianceFilingType.findOne({ code: 'EPF' });
    const existingETF = await ComplianceFilingType.findOne({ code: 'ETF' });

    if (!existingEPF) {
      await ComplianceFilingType.create({
        code: 'EPF',
        name: 'Employees Provident Fund',
        country: 'LK',
        dueDateRule: 'LAST_WORKING_DAY_NEXT_MONTH',
        internalDueDayOfMonth: 15,
        currency: 'LKR',
        isActive: true,
      });
      console.log('✓ Seeded EPF filing type');
    }

    if (!existingETF) {
      await ComplianceFilingType.create({
        code: 'ETF',
        name: 'Employees Trust Fund',
        country: 'LK',
        dueDateRule: 'LAST_WORKING_DAY_NEXT_MONTH',
        internalDueDayOfMonth: 15,
        currency: 'LKR',
        isActive: true,
      });
      console.log('✓ Seeded ETF filing type');
    }

    // Optional: EPF/ETF Combined
    const existingCombined = await ComplianceFilingType.findOne({ code: 'EPF_ETF' });
    if (!existingCombined) {
      await ComplianceFilingType.create({
        code: 'EPF_ETF',
        name: 'EPF & ETF Combined',
        country: 'LK',
        dueDateRule: 'LAST_WORKING_DAY_NEXT_MONTH',
        internalDueDayOfMonth: 15,
        currency: 'LKR',
        isActive: true,
      });
      console.log('✓ Seeded EPF/ETF Combined filing type');
    }
  } catch (error: any) {
    console.error('Failed to seed compliance filing types:', error.message);
  }
}
