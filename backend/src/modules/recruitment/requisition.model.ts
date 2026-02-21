import mongoose, { Schema, Document } from 'mongoose';

export interface IRequisition extends Document {
  title: string;
  departmentId: mongoose.Types.ObjectId;
  location: string;
  type: 'full_time' | 'contract' | 'intern';
  justification: string;
  budgetCode?: string;
  estimatedSalaryBand: {
    min: number;
    max: number;
  };
  status: 'DRAFT' | 'MANAGER_APPROVED' | 'FINANCE_APPROVED' | 'HR_APPROVED' | 'PUBLISHED' | 'CLOSED' | 'REJECTED';
  budgetHoldFlag: boolean;
  aboutTheRole?: string;
  keyResponsibilities?: string[];
  requirements?: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const requisitionSchema = new Schema<IRequisition>(
  {
    title: {
      type: String,
      required: true,
      index: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },
    location: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['full_time', 'contract', 'intern'],
      required: true,
    },
    justification: {
      type: String,
      required: true,
    },
    budgetCode: String,
    estimatedSalaryBand: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
    },
    status: {
      type: String,
      enum: ['DRAFT', 'MANAGER_APPROVED', 'FINANCE_APPROVED', 'HR_APPROVED', 'PUBLISHED', 'CLOSED', 'REJECTED'],
      default: 'DRAFT',
      index: true,
    },
    budgetHoldFlag: {
      type: Boolean,
      default: false,
    },
    aboutTheRole: {
      type: String,
    },
    keyResponsibilities: [{
      type: String,
    }],
    requirements: [{
      type: String,
    }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Requisition = mongoose.model<IRequisition>('Requisition', requisitionSchema);
