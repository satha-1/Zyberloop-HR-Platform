import mongoose, { Document, Schema } from 'mongoose';

export interface IApitTaxSlab {
  minMonthlyIncome: number;
  maxMonthlyIncome?: number;
  fixedTax: number;
  ratePercent: number;
}

export interface IApitTaxTable extends Document {
  tableCode: string; // e.g., TABLE_01
  name: string;
  currency: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  slabs: IApitTaxSlab[];
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const apitTaxSlabSchema = new Schema<IApitTaxSlab>(
  {
    minMonthlyIncome: { type: Number, required: true, min: 0 },
    maxMonthlyIncome: { type: Number, min: 0 },
    fixedTax: { type: Number, required: true, min: 0 },
    ratePercent: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const apitTaxTableSchema = new Schema<IApitTaxTable>(
  {
    tableCode: { type: String, required: true, uppercase: true, index: true },
    name: { type: String, required: true, trim: true },
    currency: { type: String, default: 'LKR' },
    effectiveFrom: { type: Date, required: true, index: true },
    effectiveTo: { type: Date, index: true },
    slabs: { type: [apitTaxSlabSchema], default: [] },
    notes: { type: String, trim: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

apitTaxTableSchema.index({ tableCode: 1, effectiveFrom: -1 });

export const ApitTaxTable = mongoose.model<IApitTaxTable>('ApitTaxTable', apitTaxTableSchema);
