import mongoose, { Schema, Document } from 'mongoose';

export type DocType = 'OFFER_LETTER' | 'APPOINTMENT_LETTER' | 'PAYSLIP' | 'FINAL_SETTLEMENT' | 'EXPERIENCE_CERT';
export type SubjectType = 'EMPLOYEE' | 'CANDIDATE' | 'PAYROLL_RUN' | 'TERMINATION_CASE';
export type DocumentStatus = 'GENERATED' | 'SIGNING_PENDING' | 'SIGNED' | 'VOIDED' | 'REVOKED' | 'ARCHIVED' | 'EXPIRED';
export type ArtefactKind = 'PDF_MASTER' | 'PDF_DELIVERABLE' | 'DOCX_SOURCE' | 'SIGNED_PDF' | 'AUDIT_CERTIFICATE' | 'ZIP_BUNDLE';

export interface IDocument extends Document {
  tenantId?: mongoose.Types.ObjectId;
  docType: DocType;
  templateId: mongoose.Types.ObjectId;
  templateVersion: number;
  subjectType: SubjectType;
  subjectId: mongoose.Types.ObjectId | string;
  status: DocumentStatus;
  renderInputSnapshot: {
    sha256: string;
    storedObjectKey?: string;
    redactedPreview?: any;
  };
  artefacts: Array<{
    kind: ArtefactKind;
    objectKey: string;
    contentType: string;
    sha256: string;
    sizeBytes: number;
    createdAt: Date;
    retention?: {
      retainUntil?: Date;
      legalHold?: boolean;
    };
  }>;
  accessPolicy?: {
    viewRoles?: string[];
    downloadRoles?: string[];
    subjectCanView?: boolean;
  };
  expiresAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
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
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'Template',
      required: true,
    },
    templateVersion: {
      type: Number,
      required: true,
    },
    subjectType: {
      type: String,
      enum: ['EMPLOYEE', 'CANDIDATE', 'PAYROLL_RUN', 'TERMINATION_CASE'],
      required: true,
      index: true,
    },
    subjectId: {
      type: Schema.Types.Mixed,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['GENERATED', 'SIGNING_PENDING', 'SIGNED', 'VOIDED', 'REVOKED', 'ARCHIVED', 'EXPIRED'],
      default: 'GENERATED',
      index: true,
    },
    renderInputSnapshot: {
      sha256: { type: String, required: true },
      storedObjectKey: String,
      redactedPreview: Schema.Types.Mixed,
    },
    artefacts: [
      {
        kind: {
          type: String,
          enum: ['PDF_MASTER', 'PDF_DELIVERABLE', 'DOCX_SOURCE', 'SIGNED_PDF', 'AUDIT_CERTIFICATE', 'ZIP_BUNDLE'],
          required: true,
        },
        objectKey: { type: String, required: true },
        contentType: { type: String, required: true },
        sha256: { type: String, required: true },
        sizeBytes: { type: Number, required: true },
        createdAt: { type: Date, default: Date.now },
        retention: {
          retainUntil: Date,
          legalHold: Boolean,
        },
      },
    ],
    accessPolicy: {
      viewRoles: [String],
      downloadRoles: [String],
      subjectCanView: Boolean,
    },
    expiresAt: Date,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
documentSchema.index({ tenantId: 1, docType: 1, subjectType: 1, subjectId: 1 });
documentSchema.index({ tenantId: 1, status: 1 });
documentSchema.index({ tenantId: 1, createdAt: 1 });
documentSchema.index({ templateId: 1 });

export const Document = mongoose.model<IDocument>('Document', documentSchema);
