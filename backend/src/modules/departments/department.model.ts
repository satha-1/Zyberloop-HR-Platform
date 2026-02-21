import mongoose, { Schema, Document } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  code: string;
  parentDepartmentId?: mongoose.Types.ObjectId;
  headId?: mongoose.Types.ObjectId;
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
    parentDepartmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
    headId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
    },
  },
  {
    timestamps: true,
  }
);

export const Department = mongoose.model<IDepartment>('Department', departmentSchema);
