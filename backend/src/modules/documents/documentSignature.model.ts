import mongoose, { Schema, Document } from 'mongoose';

export type SigningMode = 'PROVIDER_ESIGN' | 'INTERNAL_PDF_CERT';
export type SigningProvider = 'DOCUSIGN' | 'PANDADOC' | 'ACROBAT_SIGN' | 'DOCUSEAL' | 'NONE';
export type SignatureEventType = 'SENT' | 'VIEWED' | 'SIGNED' | 'DECLINED' | 'COMPLETED' | 'ERROR';

export interface IDocumentSignature extends Document {
  tenantId?: mongoose.Types.ObjectId;
  documentId: mongoose.Types.ObjectId;
  mode: SigningMode;
  provider: SigningProvider;
  providerEnvelopeId?: string;
  providerDocumentId?: string;
  signers: Array<{
    name: string;
    email: string;
    role: string;
    authMethod?: 'EMAIL' | 'OTP' | 'SSO';
    signedAt?: Date;
    declinedAt?: Date;
  }>;
  events: Array<{
    type: SignatureEventType;
    timestamp: Date;
    ip?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }>;
  evidenceObjectKeys?: string[]; // For provider certificates/audit-trails
  webhookStatus?: string;
  createdAt: Date;
  updatedAt: Date;
}

const documentSignatureSchema = new Schema<IDocumentSignature>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      index: true,
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    mode: {
      type: String,
      enum: ['PROVIDER_ESIGN', 'INTERNAL_PDF_CERT'],
      required: true,
    },
    provider: {
      type: String,
      enum: ['DOCUSIGN', 'PANDADOC', 'ACROBAT_SIGN', 'DOCUSEAL', 'NONE'],
      default: 'NONE',
    },
    providerEnvelopeId: String,
    providerDocumentId: String,
    signers: [
      {
        name: { type: String, required: true },
        email: { type: String, required: true },
        role: { type: String, required: true },
        authMethod: { type: String, enum: ['EMAIL', 'OTP', 'SSO'] },
        signedAt: Date,
        declinedAt: Date,
      },
    ],
    events: [
      {
        type: {
          type: String,
          enum: ['SENT', 'VIEWED', 'SIGNED', 'DECLINED', 'COMPLETED', 'ERROR'],
          required: true,
        },
        timestamp: { type: Date, default: Date.now },
        ip: String,
        userAgent: String,
        metadata: Schema.Types.Mixed,
      },
    ],
    evidenceObjectKeys: [String],
    webhookStatus: String,
  },
  {
    timestamps: true,
  }
);

documentSignatureSchema.index({ documentId: 1 });
documentSignatureSchema.index({ providerEnvelopeId: 1 });

export const DocumentSignature = mongoose.model<IDocumentSignature>('DocumentSignature', documentSignatureSchema);
