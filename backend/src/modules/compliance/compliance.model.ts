import mongoose, { Schema, Document } from 'mongoose';

export interface IComplianceFiling extends Document {
  filingType: string;
  title: string;
  description: string;
  dueDate: Date;
  submittedDate?: Date;
  status: 'PENDING' | 'SUBMITTED' | 'OVERDUE' | 'APPROVED';
  departmentId?: mongoose.Types.ObjectId;
  documents: Array<{
    name: string;
    filePath: string;
    uploadedAt: Date;
  }>;
  notes: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const complianceFilingSchema = new Schema<IComplianceFiling>(
  {
    filingType: { type: String, required: true },
    title: { type: String, required: true },
    description: String,
    dueDate: { type: Date, required: true },
    submittedDate: Date,
    status: {
      type: String,
      enum: ['PENDING', 'SUBMITTED', 'OVERDUE', 'APPROVED'],
      default: 'PENDING',
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
    documents: [{
      name: String,
      filePath: String,
      uploadedAt: { type: Date, default: Date.now },
    }],
    notes: String,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

export const ComplianceFiling = mongoose.model<IComplianceFiling>('ComplianceFiling', complianceFilingSchema);
