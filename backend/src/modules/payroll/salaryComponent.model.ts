import mongoose, { Document, Schema } from 'mongoose';

export type SalaryComponentKind = 'earning' | 'deduction' | 'employer_contribution';
export type SalaryComponentCalculationMethod = 'fixed' | 'rate_x_units' | 'percent_of_base';

export interface ISalaryComponent extends Document {
  code: string;
  name: string;
  kind: SalaryComponentKind;
  taxable: boolean;
  epfEtfEligible: boolean;
  calculationMethod: SalaryComponentCalculationMethod;
  defaultAmount?: number;
  defaultRate?: number;
  baseComponentCodes?: string[];
  displayOrder: number;
  glCode?: string;
  costCenter?: string;
  isRecovery: boolean;
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const salaryComponentSchema = new Schema<ISalaryComponent>(
  {
    code: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true, index: true },
    kind: { type: String, required: true, enum: ['earning', 'deduction', 'employer_contribution'], index: true },
    taxable: { type: Boolean, default: false, index: true },
    epfEtfEligible: { type: Boolean, default: false, index: true },
    calculationMethod: { type: String, required: true, enum: ['fixed', 'rate_x_units', 'percent_of_base'] },
    defaultAmount: { type: Number, min: 0 },
    defaultRate: { type: Number, min: 0 },
    baseComponentCodes: [{ type: String, uppercase: true, trim: true }],
    displayOrder: { type: Number, default: 100 },
    glCode: { type: String, trim: true },
    costCenter: { type: String, trim: true },
    isRecovery: { type: Boolean, default: false, index: true },
    isSystem: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const SalaryComponent = mongoose.model<ISalaryComponent>('SalaryComponent', salaryComponentSchema);
