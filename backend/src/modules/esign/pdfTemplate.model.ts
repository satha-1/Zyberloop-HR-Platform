import mongoose, { Schema, Document } from 'mongoose';

export type PdfTemplateStatus = 'draft' | 'published' | 'archived';

export interface IPdfTemplate extends Document {
  name: string;
  description?: string;
  createdByUserId: mongoose.Types.ObjectId;
  status: PdfTemplateStatus;
  latestVersionId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const pdfTemplateSchema = new Schema<IPdfTemplate>(
  {
    name: {
      type: String,
      required: true,
    },
    description: String,
    createdByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    latestVersionId: {
      type: Schema.Types.ObjectId,
      ref: 'PdfTemplateVersion',
    },
  },
  { timestamps: true }
);

pdfTemplateSchema.index({ status: 1, createdAt: -1 });
pdfTemplateSchema.index({ createdByUserId: 1 });

export const PdfTemplate = mongoose.model<IPdfTemplate>('PdfTemplate', pdfTemplateSchema);
