import mongoose, { Schema, Document } from 'mongoose';

export type JobType = 'PREVIEW' | 'GENERATE' | 'BULK_GENERATE' | 'REGENERATE';
export type JobStatus = 'QUEUED' | 'RUNNING' | 'FAILED' | 'COMPLETED';

export interface IDocumentJob extends Document {
  tenantId?: mongoose.Types.ObjectId;
  jobType: JobType;
  docType?: string;
  templateId?: mongoose.Types.ObjectId;
  templateVersion?: number;
  inputsRef: Record<string, any>; // e.g., { payrollRunId, employeeIds: [...] }
  status: JobStatus;
  progress: {
    total: number;
    succeeded: number;
    failed: number;
  };
  errorReportObjectKey?: string; // CSV of failures
  errorMessage?: string;
  createdAt: Date;
  startedAt?: Date;
  finishedAt?: Date;
}

const documentJobSchema = new Schema<IDocumentJob>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      index: true,
    },
    jobType: {
      type: String,
      enum: ['PREVIEW', 'GENERATE', 'BULK_GENERATE', 'REGENERATE'],
      required: true,
    },
    docType: String,
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'Template',
    },
    templateVersion: Number,
    inputsRef: {
      type: Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ['QUEUED', 'RUNNING', 'FAILED', 'COMPLETED'],
      default: 'QUEUED',
      index: true,
    },
    progress: {
      total: { type: Number, default: 0 },
      succeeded: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
    },
    errorReportObjectKey: String,
    errorMessage: String,
    startedAt: Date,
    finishedAt: Date,
  },
  {
    timestamps: true,
  }
);

documentJobSchema.index({ tenantId: 1, status: 1, createdAt: 1 });
documentJobSchema.index({ jobType: 1, status: 1 });

export const DocumentJob = mongoose.model<IDocumentJob>('DocumentJob', documentJobSchema);
