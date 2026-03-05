import mongoose, { Schema, Document } from 'mongoose';

export interface ISignRequestFieldValue extends Document {
  envelopeId: mongoose.Types.ObjectId;
  fieldId: string;
  filledByRecipientId: string;
  value?: string; // text, date, checkbox boolean as string
  signatureAssetId?: mongoose.Types.ObjectId;
  signatureS3KeySnapshot?: string; // snapshot of the signature image used
  filledAt: Date;
  ip?: string;
  userAgent?: string;
}

const signRequestFieldValueSchema = new Schema<ISignRequestFieldValue>(
  {
    envelopeId: {
      type: Schema.Types.ObjectId,
      ref: 'SignRequestEnvelope',
      required: true,
      index: true,
    },
    fieldId: {
      type: String,
      required: true,
    },
    filledByRecipientId: {
      type: String,
      required: true,
    },
    value: String,
    signatureAssetId: {
      type: Schema.Types.ObjectId,
      ref: 'SignatureAsset',
    },
    signatureS3KeySnapshot: String,
    filledAt: {
      type: Date,
      default: Date.now,
    },
    ip: String,
    userAgent: String,
  },
  { timestamps: true }
);

signRequestFieldValueSchema.index({ envelopeId: 1, fieldId: 1 });

export const SignRequestFieldValue = mongoose.model<ISignRequestFieldValue>(
  'SignRequestFieldValue',
  signRequestFieldValueSchema
);
