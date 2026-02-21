import mongoose, { Schema, Document } from 'mongoose';

export interface ICandidateApplication extends Document {
  candidateId: mongoose.Types.ObjectId;
  requisitionId: mongoose.Types.ObjectId;
  source: string;
  status: 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFERED' | 'HIRED' | 'REJECTED';
  matchScore: number;
  skillMatch: number;
  experienceMatch: number;
  interviewHistory: Array<{
    date: Date;
    interviewer: string;
    notes: string;
    rating: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const candidateApplicationSchema = new Schema<ICandidateApplication>(
  {
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
      index: true,
    },
    requisitionId: {
      type: Schema.Types.ObjectId,
      ref: 'Requisition',
      required: true,
      index: true,
    },
    source: {
      type: String,
      default: 'PORTAL',
    },
    status: {
      type: String,
      enum: ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFERED', 'HIRED', 'REJECTED'],
      default: 'APPLIED',
      index: true,
    },
    matchScore: {
      type: Number,
      default: 0,
    },
    skillMatch: {
      type: Number,
      default: 0,
    },
    experienceMatch: {
      type: Number,
      default: 0,
    },
    interviewHistory: [
      {
        date: Date,
        interviewer: String,
        notes: String,
        rating: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const CandidateApplication = mongoose.model<ICandidateApplication>(
  'CandidateApplication',
  candidateApplicationSchema
);
