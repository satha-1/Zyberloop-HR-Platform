import mongoose, { Schema, Document } from 'mongoose';

export interface IPayrollRun extends Document {
  templateId?: mongoose.Types.ObjectId;
  runName: string;
  periodStart: Date;
  periodEnd: Date;
  paymentDate: Date;
  status: 'draft' | 'in_progress' | 'completed' | 'locked' | 'DRAFT' | 'CALCULATED' | 'REVIEW_PENDING' | 'HR_APPROVED' | 'FINANCE_APPROVED' | 'FINALIZED' | 'PARTIAL_FAILED';
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  totalGross: number;
  totalNet: number;
  totalDeductions?: number;
  employeeCount: number;
  employeeLines?: Array<{
    employeeId: mongoose.Types.ObjectId;
    employeeName: string;
    baseSalary: number;
    payItems: Array<{
      payItemId: string;
      code: string;
      label: string;
      type: 'earning' | 'deduction' | 'benefit';
      amount: number;
    }>;
    grossPay: number;
    totalDeductions: number;
    netPay: number;
  }>;
  meta?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const payrollRunSchema = new Schema<IPayrollRun>(
  {
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'PayrollTemplate',
      index: true,
    },
    runName: {
      type: String,
      required: true,
      default: 'Payroll Run',
      index: true,
    },
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
    paymentDate: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'in_progress', 'completed', 'locked', 'DRAFT', 'CALCULATED', 'REVIEW_PENDING', 'HR_APPROVED', 'FINANCE_APPROVED', 'FINALIZED', 'PARTIAL_FAILED'],
      default: 'draft',
      index: true,
    },
    notes: String,
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
    totalDeductions: {
      type: Number,
      default: 0,
    },
    employeeCount: {
      type: Number,
      default: 0,
    },
    employeeLines: [
      {
        employeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
        employeeName: String,
        baseSalary: Number,
        payItems: [
          {
            payItemId: String,
            code: String,
            label: String,
            type: { type: String, enum: ['earning', 'deduction', 'benefit'] },
            amount: Number,
          },
        ],
        grossPay: Number,
        totalDeductions: Number,
        netPay: Number,
      },
    ],
    meta: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

export const PayrollRun = mongoose.model<IPayrollRun>('PayrollRun', payrollRunSchema);
