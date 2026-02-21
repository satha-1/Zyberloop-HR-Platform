import mongoose, { Schema, Document } from 'mongoose';

export interface ICandidate extends Document {
  fullName: string;
  email: string;
  phone: string;
  resumeUrl?: string;
  currentCompany?: string;
  experienceYears: number;
  skills: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const candidateSchema = new Schema<ICandidate>(
  {
    fullName: {
      type: String,
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
    },
    resumeUrl: String,
    currentCompany: String,
    experienceYears: {
      type: Number,
      default: 0,
    },
    skills: [String],
    notes: String,
  },
  {
    timestamps: true,
  }
);

export const Candidate = mongoose.model<ICandidate>('Candidate', candidateSchema);
