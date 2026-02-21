import mongoose, { Schema, Document } from 'mongoose';

export type DocType = 'OFFER_LETTER' | 'APPOINTMENT_LETTER' | 'PAYSLIP' | 'FINAL_SETTLEMENT' | 'EXPERIENCE_CERT';
export type TemplateEngine = 'LIQUID_HTML' | 'HANDLEBARS_HTML' | 'DOCX';
export type TemplateStatus = 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED' | 'DEPRECATED';

export interface ITemplate extends Document {
  tenantId?: mongoose.Types.ObjectId; // For multi-tenancy (optional for now)
  docType: DocType;
  name: string;
  description?: string;
  tags: string[];
  engine: TemplateEngine;
  locale: string; // e.g., "en", "si-LK", "ta-LK"
  fallbackLocale?: string;
  status: TemplateStatus;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  version: number;
  previousVersionId?: mongoose.Types.ObjectId;
  content: string; // HTML markup for LIQUID_HTML/HANDLEBARS_HTML
  variablesSchema: Record<string, any>; // JSON schema describing allowed variables
  approvals: Array<{
    actorId: mongoose.Types.ObjectId;
    actorName: string;
    decision: 'APPROVED' | 'REJECTED';
    notes?: string;
    at: Date;
  }>;
  createdBy: mongoose.Types.ObjectId;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const templateSchema = new Schema<ITemplate>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      index: true,
    },
    docType: {
      type: String,
      enum: ['OFFER_LETTER', 'APPOINTMENT_LETTER', 'PAYSLIP', 'FINAL_SETTLEMENT', 'EXPERIENCE_CERT'],
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: String,
    tags: [String],
    engine: {
      type: String,
      enum: ['LIQUID_HTML', 'HANDLEBARS_HTML', 'DOCX'],
      default: 'HANDLEBARS_HTML',
    },
    locale: {
      type: String,
      required: true,
      default: 'en',
      index: true,
    },
    fallbackLocale: String,
    status: {
      type: String,
      enum: ['DRAFT', 'IN_REVIEW', 'PUBLISHED', 'DEPRECATED'],
      default: 'DRAFT',
      index: true,
    },
    effectiveFrom: Date,
    effectiveTo: Date,
    version: {
      type: Number,
      default: 1,
    },
    previousVersionId: {
      type: Schema.Types.ObjectId,
      ref: 'Template',
    },
    content: {
      type: String,
      required: true,
    },
    variablesSchema: {
      type: Schema.Types.Mixed,
      default: {},
    },
    approvals: [
      {
        actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        actorName: { type: String, required: true },
        decision: { type: String, enum: ['APPROVED', 'REJECTED'], required: true },
        notes: String,
        at: { type: Date, default: Date.now },
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    publishedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
templateSchema.index({ tenantId: 1, docType: 1, locale: 1, status: 1 });
templateSchema.index({ tenantId: 1, docType: 1, effectiveFrom: 1 });
templateSchema.index({ tenantId: 1, status: 1, createdAt: 1 });

export const Template = mongoose.model<ITemplate>('Template', templateSchema);
