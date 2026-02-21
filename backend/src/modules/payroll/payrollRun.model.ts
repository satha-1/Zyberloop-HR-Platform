import mongoose, { Schema, Document } from 'mongoose';

export interface IPayrollRun extends Document {
  periodStart: Date;
  periodEnd: Date;
  status: 'DRAFT' | 'CALCULATED' | 'REVIEW_PENDING' | 'HR_APPROVED' | 'FINANCE_APPROVED' | 'FINALIZED' | 'PARTIAL_FAILED';
  createdBy: mongoose.Types.ObjectId;
  totalGross: number;
  totalNet: number;
  employeeCount: number;
  meta?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const payrollRunSchema = new Schema<IPayrollRun>(
  {
    periodStart: {
      type: Date,
      required: true,
      index: true,
    },
    periodEnd: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'CALCULATED', 'REVIEW_PENDING', 'HR_APPROVED', 'FINANCE_APPROVED', 'FINALIZED', 'PARTIAL_FAILED'],
      default: 'DRAFT',
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    totalGross: {
      type: Number,
      default: 0,
    },
    totalNet: {
      type: Number,
      default: 0,
    },
    employeeCount: {
      type: Number,
      default: 0,
    },
    meta: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

export const PayrollRun = mongoose.model<IPayrollRun>('PayrollRun', payrollRunSchema);
