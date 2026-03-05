import mongoose, { Schema, Document } from 'mongoose';

export type EnvelopeStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'in_progress'
  | 'completed'
  | 'finalised'
  | 'declined'
  | 'expired'
  | 'voided';

export type RecipientStatus = 'pending' | 'sent' | 'viewed' | 'signed' | 'declined';

export interface IRecipient {
  recipientId: string;
  employeeId?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  role: string;
  signingOrder: number;
  status: RecipientStatus;
  viewedAt?: Date;
  signedAt?: Date;
  declinedAt?: Date;
}

export interface IAuditEvent {
  eventType: string;
  actorUserId?: string;
  actorEmail?: string;
  actorRole?: string;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
  fieldId?: string;
  signatureAssetId?: string;
  signatureHash?: string;
  pageCoords?: string;
  metadata?: Record<string, any>;
}

export interface ISignRequestEnvelope extends Document {
  templateId: mongoose.Types.ObjectId;
  templateVersionId: mongoose.Types.ObjectId;
  displayName: string;
  createdByUserId: mongoose.Types.ObjectId;
  status: EnvelopeStatus;
  recipients: IRecipient[];
  expiryAt?: Date;
  reminderConfig?: {
    enabled: boolean;
    intervalDays: number;
  };
  emailSubject?: string;
  emailBody?: string;
  signingLinkTokenHash?: string;
  sentAt?: Date;
  finalisedAt?: Date;
  sourcePdfS3Key?: string;
  signedPdfS3Key?: string;
  signedPdfHashSha256?: string;
  auditTrail: IAuditEvent[];
  auditTrailS3Key?: string;
  createdAt: Date;
  updatedAt: Date;
}

const recipientSchema = new Schema(
  {
    recipientId: { type: String, required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, default: 'employee' },
    signingOrder: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ['pending', 'sent', 'viewed', 'signed', 'declined'],
      default: 'pending',
    },
    viewedAt: Date,
    signedAt: Date,
    declinedAt: Date,
  },
  { _id: false }
);

const auditEventSchema = new Schema(
  {
    eventType: { type: String, required: true },
    actorUserId: String,
    actorEmail: String,
    actorRole: String,
    timestamp: { type: Date, default: Date.now },
    ip: String,
    userAgent: String,
    fieldId: String,
    signatureAssetId: String,
    signatureHash: String,
    pageCoords: String,
    metadata: Schema.Types.Mixed,
  },
  { _id: false }
);

const signRequestEnvelopeSchema = new Schema<ISignRequestEnvelope>(
  {
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'PdfTemplate',
      required: true,
      index: true,
    },
    templateVersionId: {
      type: Schema.Types.ObjectId,
      ref: 'PdfTemplateVersion',
      required: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    createdByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'sent', 'viewed', 'in_progress', 'completed', 'finalised', 'declined', 'expired', 'voided'],
      default: 'draft',
      index: true,
    },
    recipients: [recipientSchema],
    expiryAt: Date,
    reminderConfig: {
      enabled: { type: Boolean, default: false },
      intervalDays: { type: Number, default: 3 },
    },
    emailSubject: String,
    emailBody: String,
    signingLinkTokenHash: String,
    sentAt: Date,
    finalisedAt: Date,
    sourcePdfS3Key: String,
    signedPdfS3Key: String,
    signedPdfHashSha256: String,
    auditTrail: [auditEventSchema],
    auditTrailS3Key: String,
  },
  { timestamps: true }
);

signRequestEnvelopeSchema.index({ status: 1, createdAt: -1 });
signRequestEnvelopeSchema.index({ createdByUserId: 1 });
signRequestEnvelopeSchema.index({ templateId: 1 });
signRequestEnvelopeSchema.index({ 'recipients.email': 1 });
signRequestEnvelopeSchema.index({ 'recipients.employeeId': 1 });

export const SignRequestEnvelope = mongoose.model<ISignRequestEnvelope>(
  'SignRequestEnvelope',
  signRequestEnvelopeSchema
);
