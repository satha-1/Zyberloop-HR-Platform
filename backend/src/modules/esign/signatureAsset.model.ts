import mongoose, { Schema, Document } from 'mongoose';

export type SignatureAssetType = 'signature' | 'initials' | 'stamp';
export type SignatureMethod = 'drawn' | 'typed' | 'uploaded';

export interface ISignatureAsset extends Document {
  ownerUserId: mongoose.Types.ObjectId;
  type: SignatureAssetType;
  method: SignatureMethod;
  label?: string;
  typedText?: string;
  fontName?: string;
  vectorData?: string; // JSON/SVG for drawn signatures
  s3Key: string;
  mimeType: string;
  size: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const signatureAssetSchema = new Schema<ISignatureAsset>(
  {
    ownerUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['signature', 'initials', 'stamp'],
      required: true,
    },
    method: {
      type: String,
      enum: ['drawn', 'typed', 'uploaded'],
      required: true,
    },
    label: String,
    typedText: String,
    fontName: String,
    vectorData: String,
    s3Key: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

signatureAssetSchema.index({ ownerUserId: 1, type: 1 });
signatureAssetSchema.index({ ownerUserId: 1, isDefault: 1 });

export const SignatureAsset = mongoose.model<ISignatureAsset>('SignatureAsset', signatureAssetSchema);
