import mongoose, { Schema, Document } from 'mongoose';

export interface IGeneratedDocument extends Document {
  employeeId: mongoose.Types.ObjectId;
  templateId: mongoose.Types.ObjectId;
  documentType: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  generatedData: Record<string, any>;
  version: number;
  generatedBy: mongoose.Types.ObjectId;
  generatedAt: Date;
  isFinalized: boolean;
  finalizedAt?: Date;
}

const generatedDocumentSchema = new Schema<IGeneratedDocument>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'DocumentTemplate',
      required: true,
    },
    documentType: {
      type: String,
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
    generatedData: {
      type: Schema.Types.Mixed,
      required: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    generatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    isFinalized: {
      type: Boolean,
      default: false,
    },
    finalizedAt: Date,
  },
  {
    timestamps: true,
  }
);

generatedDocumentSchema.index({ employeeId: 1, documentType: 1 });
generatedDocumentSchema.index({ employeeId: 1, version: 1 });

export const GeneratedDocument = mongoose.model<IGeneratedDocument>('GeneratedDocument', generatedDocumentSchema);
