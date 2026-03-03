import mongoose, { Schema, Document } from 'mongoose';

export type JobAdvancementActionType =
  | 'PROMOTION'
  | 'TRANSFER'
  | 'SALARY_REVISION'
  | 'MANAGER_CHANGE'
  | 'EMPLOYMENT_TYPE_CHANGE'
  | 'GRADE_CHANGE'
  | 'OTHER';

export interface IEmployeeJobAdvancement extends Document {
  employeeId: mongoose.Types.ObjectId;
  actionType: JobAdvancementActionType;
  effectiveFrom: Date;
  effectiveTo?: Date; // NULL = current record
  departmentId?: mongoose.Types.ObjectId;
  managerId?: mongoose.Types.ObjectId;
  jobTitle?: string;
  employmentType?: 'permanent' | 'contract' | 'intern' | 'casual';
  locationId?: mongoose.Types.ObjectId;
  workLocation?: string;
  salaryPackageId?: mongoose.Types.ObjectId; // Link to salary package/compensation assignment
  grade?: string;
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const employeeJobAdvancementSchema = new Schema<IEmployeeJobAdvancement>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    actionType: {
      type: String,
      enum: [
        'PROMOTION',
        'TRANSFER',
        'SALARY_REVISION',
        'MANAGER_CHANGE',
        'EMPLOYMENT_TYPE_CHANGE',
        'GRADE_CHANGE',
        'OTHER',
      ],
      required: true,
      index: true,
    },
    effectiveFrom: {
      type: Date,
      required: true,
      index: true,
    },
    effectiveTo: {
      type: Date,
      default: null,
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
    jobTitle: {
      type: String,
      trim: true,
    },
    employmentType: {
      type: String,
      enum: ['permanent', 'contract', 'intern', 'casual'],
    },
    locationId: {
      type: Schema.Types.ObjectId,
      ref: 'Location', // If you have a Location model
    },
    workLocation: {
      type: String,
      trim: true,
    },
    salaryPackageId: {
      type: Schema.Types.ObjectId,
      ref: 'EmployeeSalaryComponent', // Link to compensation assignment
    },
    grade: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure at most one current record per employee
employeeJobAdvancementSchema.index(
  { employeeId: 1, effectiveTo: 1 },
  {
    partialFilterExpression: { effectiveTo: null },
  }
);

// Index for timeline queries
employeeJobAdvancementSchema.index({ employeeId: 1, effectiveFrom: 1 });

export const EmployeeJobAdvancement = mongoose.model<IEmployeeJobAdvancement>(
  'EmployeeJobAdvancement',
  employeeJobAdvancementSchema
);
