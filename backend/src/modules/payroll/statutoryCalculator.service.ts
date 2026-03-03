import { IApitTaxSlab } from './apitTaxTable.model';

export type ComponentKind = 'earning' | 'deduction' | 'employer_contribution';

export type CalculatedComponentLine = {
  code: string;
  label: string;
  kind: ComponentKind;
  amount: number;
  taxable: boolean;
  epfEtfEligible: boolean;
  isRecovery: boolean;
  displayOrder: number;
};

export type StatutoryResult = {
  epfEtfEligibleEarnings: number;
  taxableEarnings: number;
  epfEmployee: number;
  epfEmployer: number;
  etfEmployer: number;
  apit: number;
};

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateApitFromSlabs(monthlyTaxableIncome: number, slabs: IApitTaxSlab[]): number {
  if (monthlyTaxableIncome <= 0 || slabs.length === 0) return 0;

  const slab = slabs.find((s) => {
    const inMin = monthlyTaxableIncome >= s.minMonthlyIncome;
    const inMax = s.maxMonthlyIncome == null || monthlyTaxableIncome <= s.maxMonthlyIncome;
    return inMin && inMax;
  });

  if (!slab) return 0;
  const taxableOverMin = Math.max(0, monthlyTaxableIncome - slab.minMonthlyIncome);
  const variableTax = (taxableOverMin * slab.ratePercent) / 100;
  return round2(slab.fixedTax + variableTax);
}

export function calculateSriLankaStatutory(lines: CalculatedComponentLine[], apitSlabs: IApitTaxSlab[]): StatutoryResult {
  const earningLines = lines.filter((l) => l.kind === 'earning');
  const epfEtfEligibleEarnings = round2(
    earningLines
      .filter((l) => l.epfEtfEligible)
      .reduce((sum, l) => sum + l.amount, 0)
  );
  const taxableEarnings = round2(
    earningLines
      .filter((l) => l.taxable)
      .reduce((sum, l) => sum + l.amount, 0)
  );

  const epfEmployee = round2(epfEtfEligibleEarnings * 0.08);
  const epfEmployer = round2(epfEtfEligibleEarnings * 0.12);
  const etfEmployer = round2(epfEtfEligibleEarnings * 0.03);
  const apit = calculateApitFromSlabs(taxableEarnings, apitSlabs);

  return {
    epfEtfEligibleEarnings,
    taxableEarnings,
    epfEmployee,
    epfEmployer,
    etfEmployer,
    apit,
  };
}

export function buildTotals(lines: CalculatedComponentLine[], statutory: StatutoryResult) {
  const earnings = round2(lines.filter((l) => l.kind === 'earning').reduce((sum, l) => sum + l.amount, 0));
  const manualDeductions = round2(lines.filter((l) => l.kind === 'deduction').reduce((sum, l) => sum + l.amount, 0));
  const employerContributions = round2(
    lines.filter((l) => l.kind === 'employer_contribution').reduce((sum, l) => sum + l.amount, 0)
  );

  const deductions = round2(manualDeductions + statutory.epfEmployee + statutory.apit);
  const statutoryEmployerContributions = round2(statutory.epfEmployer + statutory.etfEmployer);
  const totalEmployerContributions = round2(employerContributions + statutoryEmployerContributions);
  const netPay = round2(earnings - deductions);
  const totalEmployerCost = round2(earnings + totalEmployerContributions);

  return {
    earnings,
    deductions,
    employerContributions: totalEmployerContributions,
    netPay,
    totalEmployerCost,
  };
}
