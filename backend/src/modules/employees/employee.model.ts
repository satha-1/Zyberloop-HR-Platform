import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployee extends Document {
  employeeCode: string;
  userId?: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob?: Date;
  address?: string;
  grade: string;
  departmentId?: mongoose.Types.ObjectId;
  managerId?: mongoose.Types.ObjectId;
  hireDate: Date;
  terminationDate?: Date;
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  salary: number;
  compensationHistory: Array<{
    effectiveDate: Date;
    salary: number;
    allowances: Array<{ name: string; amount: number }>;
    reason: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const employeeSchema = new Schema<IEmployee>(
  {
    employeeCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    firstName: {
      type: String,
      required: true,
      index: true,
    },
    lastName: {
      type: String,
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
    },
    dob: Date,
    address: String,
    grade: {
      type: String,
      required: true,
      index: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      index: true,
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      index: true,
    },
    hireDate: {
      type: Date,
      required: true,
      index: true,
    },
    terminationDate: Date,
    status: {
      type: String,
      enum: ['active', 'inactive', 'on_leave', 'terminated'],
      default: 'active',
      index: true,
    },
    salary: {
      type: Number,
      required: true,
    },
    compensationHistory: [
      {
        effectiveDate: Date,
        salary: Number,
        allowances: [
          {
            name: String,
            amount: Number,
          },
        ],
        reason: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Employee = mongoose.model<IEmployee>('Employee', employeeSchema);
