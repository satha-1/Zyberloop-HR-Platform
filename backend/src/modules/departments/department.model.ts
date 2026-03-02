import mongoose, { Schema, Document } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  code: string;
  description?: string;
  parentDepartmentId?: mongoose.Types.ObjectId;
  headId?: mongoose.Types.ObjectId;
  location?: string;
  costCenter?: string;
  status: 'ACTIVE' | 'INACTIVE';
  effectiveFrom?: Date;
  email?: string;
  phoneExt?: string;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<IDepartment>(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    description: {
      type: String,
    },
    parentDepartmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
    headId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
    },
    location: {
      type: String,
    },
    costCenter: {
      type: String,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      index: true,
    },
    effectiveFrom: {
      type: Date,
    },
    email: {
      type: String,
      lowercase: true,
    },
    phoneExt: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Department = mongoose.model<IDepartment>('Department', departmentSchema);
