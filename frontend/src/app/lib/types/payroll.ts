// Payroll Management Module - TypeScript Type Definitions

export type PayFrequency = "monthly" | "biweekly" | "weekly";
export type PayItemType = "earning" | "deduction" | "benefit";
export type CalculationType = "flat" | "percentage";
export type AppliesTo = "basicSalary" | "gross" | "net" | "custom";
export type PayrollRunStatus = "draft" | "in_progress" | "completed" | "locked";

// Pay Item Model
export interface PayItem {
  id: string;
  code: string;
  label: string;
  type: PayItemType;
  calculationType: CalculationType;
  amount: number | null;
  percentage: number | null;
  appliesTo: AppliesTo;
  isTaxable: boolean;
  isDefault: boolean;
}

// Tax Configuration Model
export interface TaxConfig {
  country: string;
  taxYear: number;
  hasProgressiveTax: boolean;
  notes?: string;
}

// Payroll Template Model
export interface PayrollTemplate {
  id: string;
  name: string;
  description?: string;
  payFrequency: PayFrequency;
  currency: string;
  isActive: boolean;
  effectiveFrom: string; // ISO date
  effectiveTo?: string; // ISO date, optional
  defaultPayItems: PayItem[];
  taxConfig: TaxConfig;
  createdAt: string;
  updatedAt: string;
}

// Pay Item Line (resolved amount in a payroll run)
export interface PayItemLine {
  payItemId: string;
  code: string;
  label: string;
  type: PayItemType;
  amount: number; // Resolved number after applying flat/percentage logic
}

// Payroll Run Employee Line
export interface PayrollRunEmployeeLine {
  employeeId: string;
  employeeName: string;
  baseSalary: number;
  payItems: PayItemLine[];
  grossPay: number;
  totalDeductions: number;
  netPay: number;
}

// Payroll Run Model
export interface PayrollRun {
  id: string;
  templateId: string;
  templateName?: string;
  periodStart: string; // ISO date
  periodEnd: string; // ISO date
  paymentDate: string; // ISO date
  status: PayrollRunStatus;
  runName: string;
  notes?: string;
  employeeCount: number;
  totalGross: number;
  totalNet: number;
  totalDeductions?: number;
  employeeLines?: PayrollRunEmployeeLine[];
  createdAt: string;
  updatedAt: string;
}

// API Request/Response Types
export interface CreatePayrollTemplatePayload {
  name: string;
  description?: string;
  payFrequency: PayFrequency;
  currency: string;
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  defaultPayItems: Omit<PayItem, "id">[];
  taxConfig: TaxConfig;
}

export interface UpdatePayrollTemplatePayload extends Partial<CreatePayrollTemplatePayload> {}

export interface CreatePayrollRunPayload {
  templateId: string;
  runName: string;
  periodStart: string;
  periodEnd: string;
  paymentDate: string;
  notes?: string;
  employeeIds?: string[]; // Optional: if not provided, use all active employees
}

export interface UpdatePayrollRunPayload extends Partial<CreatePayrollRunPayload> {
  employeeLines?: PayrollRunEmployeeLine[];
}

export interface PayrollRunPreview {
  employeeLines: PayrollRunEmployeeLine[];
  totals: {
    employeeCount: number;
    totalGross: number;
    totalDeductions: number;
    totalNet: number;
  };
}

// Filter/Query Types
export interface PayrollTemplateFilters {
  search?: string;
  payFrequency?: PayFrequency;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface PayrollRunFilters {
  search?: string;
  status?: PayrollRunStatus;
  templateId?: string;
  periodStart?: string;
  periodEnd?: string;
  page?: number;
  limit?: number;
}
