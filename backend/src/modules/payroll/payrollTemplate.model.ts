import mongoose, { Schema, Document } from 'mongoose';

export interface IPayItem {
  code: string;
  label: string;
  type: 'earning' | 'deduction' | 'benefit';
  calculationType: 'flat' | 'percentage';
  amount: number | null;
  percentage: number | null;
  appliesTo: 'basicSalary' | 'gross' | 'net' | 'custom';
  isTaxable: boolean;
  isDefault: boolean;
}

export interface ITaxConfig {
  country: string;
  taxYear: number;
  hasProgressiveTax: boolean;
  notes?: string;
}

export interface IPayrollTemplate extends Document {
  name: string;
  description?: string;
  payFrequency: 'monthly' | 'biweekly' | 'weekly';
  currency: string;
  isActive: boolean;
  effectiveFrom: Date;
  effectiveTo?: Date;
  defaultPayItems: IPayItem[];
  taxConfig: ITaxConfig;
  createdAt: Date;
  updatedAt: Date;
}

const payItemSchema = new Schema<IPayItem>(
  {
    code: { type: String, required: true },
    label: { type: String, required: true },
    type: {
      type: String,
      enum: ['earning', 'deduction', 'benefit'],
      required: true,
    },
    calculationType: {
      type: String,
      enum: ['flat', 'percentage'],
      required: true,
    },
    amount: { type: Number, default: null },
    percentage: { type: Number, default: null },
    appliesTo: {
      type: String,
      enum: ['basicSalary', 'gross', 'net', 'custom'],
      default: 'basicSalary',
    },
    isTaxable: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: true },
  },
  { _id: false }
);

const taxConfigSchema = new Schema<ITaxConfig>(
  {
    country: { type: String, required: true },
    taxYear: { type: Number, required: true },
    hasProgressiveTax: { type: Boolean, default: false },
    notes: { type: String },
  },
  { _id: false }
);

const payrollTemplateSchema = new Schema<IPayrollTemplate>(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    description: String,
    payFrequency: {
      type: String,
      enum: ['monthly', 'biweekly', 'weekly'],
      required: true,
      index: true,
    },
    currency: {
      type: String,
      required: true,
      default: 'LKR',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    effectiveFrom: {
      type: Date,
      required: true,
      index: true,
    },
    effectiveTo: {
      type: Date,
      index: true,
    },
    defaultPayItems: [payItemSchema],
    taxConfig: {
      type: taxConfigSchema,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for searching
payrollTemplateSchema.index({ name: 'text', description: 'text' });

export const PayrollTemplate = mongoose.model<IPayrollTemplate>(
  'PayrollTemplate',
  payrollTemplateSchema
);
