import mongoose, { Schema, Document } from 'mongoose';

export interface IDocumentTemplate extends Document {
  name: string;
  type: 'OFFER_LETTER' | 'APPOINTMENT_LETTER' | 'WARNING_LETTER' | 'TERMINATION_LETTER' | 'SALARY_INCREMENT_LETTER';
  content: string;
  placeholders: string[];
  version: number;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const documentTemplateSchema = new Schema<IDocumentTemplate>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ['OFFER_LETTER', 'APPOINTMENT_LETTER', 'WARNING_LETTER', 'TERMINATION_LETTER', 'SALARY_INCREMENT_LETTER'],
      required: true,
      unique: true,
    },
    content: {
      type: String,
      required: true,
    },
    placeholders: [String],
    version: {
      type: Number,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
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

export const DocumentTemplate = mongoose.model<IDocumentTemplate>('DocumentTemplate', documentTemplateSchema);
