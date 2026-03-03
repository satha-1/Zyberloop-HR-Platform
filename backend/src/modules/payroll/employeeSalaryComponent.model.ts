import mongoose, { Document, Schema } from 'mongoose';

export interface IEmployeeSalaryComponent extends Document {
  employeeId: mongoose.Types.ObjectId;
  salaryComponentId: mongoose.Types.ObjectId;
  effectiveFrom: Date;
  effectiveTo?: Date;
  amount?: number;
  rate?: number;
  units?: number;
  percentage?: number;
  baseComponentCodes?: string[];
  notes?: string;
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const employeeSalaryComponentSchema = new Schema<IEmployeeSalaryComponent>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    salaryComponentId: { type: Schema.Types.ObjectId, ref: 'SalaryComponent', required: true, index: true },
    effectiveFrom: { type: Date, required: true, index: true },
    effectiveTo: { type: Date, index: true },
    amount: { type: Number, min: 0 },
    rate: { type: Number, min: 0 },
    units: { type: Number, min: 0 },
    percentage: { type: Number, min: 0 },
    baseComponentCodes: [{ type: String, uppercase: true, trim: true }],
    notes: { type: String, trim: true },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

employeeSalaryComponentSchema.index({
  employeeId: 1,
  salaryComponentId: 1,
  effectiveFrom: 1,
});

export const EmployeeSalaryComponent = mongoose.model<IEmployeeSalaryComponent>(
  'EmployeeSalaryComponent',
  employeeSalaryComponentSchema
);
