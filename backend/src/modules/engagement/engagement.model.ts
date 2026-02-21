import mongoose, { Schema, Document } from 'mongoose';

export interface ISurvey extends Document {
  title: string;
  description: string;
  questions: Array<{
    question: string;
    type: 'TEXT' | 'RATING' | 'CHOICE' | 'MULTIPLE_CHOICE';
    options?: string[];
    required: boolean;
  }>;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED';
  startDate: Date;
  endDate: Date;
  targetAudience: 'ALL' | 'DEPARTMENT' | 'GRADE' | 'CUSTOM';
  targetIds?: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISurveyResponse extends Document {
  surveyId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  responses: Array<{
    questionId: number;
    answer: string | number | string[];
  }>;
  submittedAt: Date;
  createdAt: Date;
}

const surveySchema = new Schema<ISurvey>(
  {
    title: { type: String, required: true },
    description: String,
    questions: [{
      question: { type: String, required: true },
      type: {
        type: String,
        enum: ['TEXT', 'RATING', 'CHOICE', 'MULTIPLE_CHOICE'],
        required: true,
      },
      options: [String],
      required: { type: Boolean, default: false },
    }],
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'CLOSED'],
      default: 'DRAFT',
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    targetAudience: {
      type: String,
      enum: ['ALL', 'DEPARTMENT', 'GRADE', 'CUSTOM'],
      default: 'ALL',
    },
    targetIds: [Schema.Types.ObjectId],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

const surveyResponseSchema = new Schema<ISurveyResponse>(
  {
    surveyId: {
      type: Schema.Types.ObjectId,
      ref: 'Survey',
      required: true,
      index: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    responses: [{
      questionId: Number,
      answer: Schema.Types.Mixed,
    }],
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

surveyResponseSchema.index({ surveyId: 1, employeeId: 1 }, { unique: true });

export const Survey = mongoose.model<ISurvey>('Survey', surveySchema);
export const SurveyResponse = mongoose.model<ISurveyResponse>('SurveyResponse', surveyResponseSchema);
