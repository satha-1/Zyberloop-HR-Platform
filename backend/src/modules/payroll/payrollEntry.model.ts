import mongoose, { Schema, Document } from 'mongoose';

export interface IPayrollEntry extends Document {
  payrollRunId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  components: Array<{
    name: string;
    type: 'EARNING' | 'DEDUCTION';
    amount: number;
  }>;
  gross: number;
  statutoryDeductions: {
    epfEmployee: number;
    epfEmployer: number;
    etfEmployer: number;
    tax: number;
  };
  otherDeductions: number;
  net: number;
  arrears: number;
  createdAt: Date;
  updatedAt: Date;
}

const payrollEntrySchema = new Schema<IPayrollEntry>(
  {
    payrollRunId: {
      type: Schema.Types.ObjectId,
      ref: 'PayrollRun',
      required: true,
      index: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    components: [
      {
        name: String,
        type: { type: String, enum: ['EARNING', 'DEDUCTION'] },
        amount: Number,
      },
    ],
    gross: {
      type: Number,
      required: true,
    },
    statutoryDeductions: {
      epfEmployee: { type: Number, default: 0 },
      epfEmployer: { type: Number, default: 0 },
      etfEmployer: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
    },
    otherDeductions: {
      type: Number,
      default: 0,
    },
    net: {
      type: Number,
      required: true,
    },
    arrears: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const PayrollEntry = mongoose.model<IPayrollEntry>('PayrollEntry', payrollEntrySchema);
