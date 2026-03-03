import mongoose, { Document, Schema } from 'mongoose';

export interface IEmployeeBankAccount extends Document {
  employeeId: mongoose.Types.ObjectId;
  bankName: string;
  branchName?: string;
  branchCode?: string;
  accountHolderName: string;
  accountNumber: string;
  accountType: string;
  paymentMethod: 'BANK_TRANSFER' | 'CASH' | 'CHEQUE' | 'OTHER';
  effectiveFrom: Date;
  effectiveTo?: Date;
  isPrimary: boolean;
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const employeeBankAccountSchema = new Schema<IEmployeeBankAccount>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    bankName: { type: String, required: true, trim: true },
    branchName: { type: String, trim: true },
    branchCode: { type: String, trim: true },
    accountHolderName: { type: String, required: true, trim: true },
    accountNumber: { type: String, required: true, trim: true },
    accountType: { type: String, required: true, trim: true },
    paymentMethod: {
      type: String,
      enum: ['BANK_TRANSFER', 'CASH', 'CHEQUE', 'OTHER'],
      default: 'BANK_TRANSFER',
    },
    effectiveFrom: { type: Date, required: true, index: true },
    effectiveTo: { type: Date, index: true },
    isPrimary: { type: Boolean, default: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

employeeBankAccountSchema.index({ employeeId: 1, effectiveFrom: 1 });

export const EmployeeBankAccount = mongoose.model<IEmployeeBankAccount>(
  'EmployeeBankAccount',
  employeeBankAccountSchema
);
