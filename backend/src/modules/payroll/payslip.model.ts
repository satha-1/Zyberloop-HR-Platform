import mongoose, { Document, Schema } from 'mongoose';

export interface IPayslipLine {
  code: string;
  label: string;
  kind: 'earning' | 'deduction' | 'employer_contribution';
  amount: number;
  taxable: boolean;
  epfEtfEligible: boolean;
  isRecovery: boolean;
  displayOrder: number;
}

export interface IPayslip extends Document {
  payrollRunId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  periodStart: Date;
  periodEnd: Date;
  lines: IPayslipLine[];
  totals: {
    earnings: number;
    deductions: number;
    employerContributions: number;
    netPay: number;
    totalEmployerCost: number;
    epfEmployee: number;
    epfEmployer: number;
    etfEmployer: number;
    apit: number;
    epfEtfEligibleEarnings: number;
    taxableEarnings: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const payslipLineSchema = new Schema<IPayslipLine>(
  {
    code: { type: String, required: true, uppercase: true },
    label: { type: String, required: true },
    kind: { type: String, required: true, enum: ['earning', 'deduction', 'employer_contribution'] },
    amount: { type: Number, required: true, min: 0 },
    taxable: { type: Boolean, default: false },
    epfEtfEligible: { type: Boolean, default: false },
    isRecovery: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 100 },
  },
  { _id: false }
);

const payslipSchema = new Schema<IPayslip>(
  {
    payrollRunId: { type: Schema.Types.ObjectId, ref: 'PayrollRun', required: true, index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    periodStart: { type: Date, required: true, index: true },
    periodEnd: { type: Date, required: true, index: true },
    lines: { type: [payslipLineSchema], default: [] },
    totals: {
      earnings: { type: Number, default: 0 },
      deductions: { type: Number, default: 0 },
      employerContributions: { type: Number, default: 0 },
      netPay: { type: Number, default: 0 },
      totalEmployerCost: { type: Number, default: 0 },
      epfEmployee: { type: Number, default: 0 },
      epfEmployer: { type: Number, default: 0 },
      etfEmployer: { type: Number, default: 0 },
      apit: { type: Number, default: 0 },
      epfEtfEligibleEarnings: { type: Number, default: 0 },
      taxableEarnings: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

payslipSchema.index({ payrollRunId: 1, employeeId: 1 }, { unique: true });

export const Payslip = mongoose.model<IPayslip>('Payslip', payslipSchema);
