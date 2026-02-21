import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployeeDocument extends Document {
  employeeId: mongoose.Types.ObjectId;
  documentType: 'NIC' | 'PASSPORT' | 'CV' | 'APPOINTMENT_LETTER' | 'CONTRACT' | 'CERTIFICATE' | 'OTHER';
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
  version?: number;
  isActive: boolean;
}

const employeeDocumentSchema = new Schema<IEmployeeDocument>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      enum: ['NIC', 'PASSPORT', 'CV', 'APPOINTMENT_LETTER', 'CONTRACT', 'CERTIFICATE', 'OTHER'],
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    version: {
      type: Number,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

employeeDocumentSchema.index({ employeeId: 1, documentType: 1, isActive: 1 });

export const EmployeeDocument = mongoose.model<IEmployeeDocument>('EmployeeDocument', employeeDocumentSchema);
