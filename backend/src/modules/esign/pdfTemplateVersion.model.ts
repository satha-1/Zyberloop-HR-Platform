import mongoose, { Schema, Document } from 'mongoose';

export type OverlayFieldType =
  | 'static_text'
  | 'text'
  | 'checkbox'
  | 'date'
  | 'signature'
  | 'initials'
  | 'stamp';

export type AssignedRole = 'employee' | 'hr' | 'hr_admin';

export interface IOverlayField {
  fieldId: string;
  type: OverlayFieldType;
  pageIndex: number;
  x: number; // normalised 0..1
  y: number;
  width: number;
  height: number;
  required: boolean;
  assignedRole: AssignedRole;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  formattingRules?: string;
  // for static_text
  staticText?: string;
  fontSize?: number;
  fontColor?: string;
  // for stamp
  allowedStampAssetIds?: string[];
  useCompanySeal?: boolean;
}

export type TemplateVersionStatus = 'draft' | 'published';

export interface IPdfTemplateVersion extends Document {
  templateId: mongoose.Types.ObjectId;
  versionNumber: number;
  sourcePdfS3Key: string;
  sourcePdfHashSha256: string;
  pageCount: number;
  pageSizes: Array<{ width: number; height: number }>;
  overlayDefinition: IOverlayField[];
  status: TemplateVersionStatus;
  createdAt: Date;
  publishedAt?: Date;
}

const overlayFieldSchema = new Schema(
  {
    fieldId: { type: String, required: true },
    type: {
      type: String,
      enum: ['static_text', 'text', 'checkbox', 'date', 'signature', 'initials', 'stamp'],
      required: true,
    },
    pageIndex: { type: Number, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    required: { type: Boolean, default: false },
    assignedRole: {
      type: String,
      enum: ['employee', 'hr', 'hr_admin'],
      default: 'employee',
    },
    label: String,
    placeholder: String,
    defaultValue: String,
    formattingRules: String,
    staticText: String,
    fontSize: Number,
    fontColor: String,
    allowedStampAssetIds: [String],
    useCompanySeal: Boolean,
  },
  { _id: false }
);

const pdfTemplateVersionSchema = new Schema<IPdfTemplateVersion>(
  {
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'PdfTemplate',
      required: true,
      index: true,
    },
    versionNumber: {
      type: Number,
      required: true,
    },
    sourcePdfS3Key: {
      type: String,
      required: true,
    },
    sourcePdfHashSha256: {
      type: String,
      required: true,
    },
    pageCount: {
      type: Number,
      required: true,
    },
    pageSizes: [
      {
        width: { type: Number, required: true },
        height: { type: Number, required: true },
      },
    ],
    overlayDefinition: [overlayFieldSchema],
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
      index: true,
    },
    publishedAt: Date,
  },
  { timestamps: true }
);

pdfTemplateVersionSchema.index({ templateId: 1, versionNumber: -1 });

export const PdfTemplateVersion = mongoose.model<IPdfTemplateVersion>(
  'PdfTemplateVersion',
  pdfTemplateVersionSchema
);
