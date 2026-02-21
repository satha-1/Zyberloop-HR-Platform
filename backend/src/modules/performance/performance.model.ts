import mongoose, { Schema, Document } from 'mongoose';

export interface IPerformanceCycle extends Document {
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED';
  createdAt: Date;
  updatedAt: Date;
}

export interface IGoal extends Document {
  employeeId: mongoose.Types.ObjectId;
  cycleId: mongoose.Types.ObjectId;
  description: string;
  weight: number;
  target: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAppraisal extends Document {
  employeeId: mongoose.Types.ObjectId;
  cycleId: mongoose.Types.ObjectId;
  managerScore: number;
  okrAchievement: number;
  peerFeedbackScore: number;
  finalRating: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED';
  comments: string;
  createdAt: Date;
  updatedAt: Date;
}

const performanceCycleSchema = new Schema<IPerformanceCycle>(
  {
    name: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'CLOSED'],
      default: 'DRAFT',
    },
  },
  { timestamps: true }
);

const goalSchema = new Schema<IGoal>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    cycleId: {
      type: Schema.Types.ObjectId,
      ref: 'PerformanceCycle',
      required: true,
      index: true,
    },
    description: { type: String, required: true },
    weight: { type: Number, required: true, min: 0, max: 100 },
    target: String,
    status: {
      type: String,
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'],
      default: 'NOT_STARTED',
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

const appraisalSchema = new Schema<IAppraisal>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    cycleId: {
      type: Schema.Types.ObjectId,
      ref: 'PerformanceCycle',
      required: true,
      index: true,
    },
    managerScore: { type: Number, min: 0, max: 100 },
    okrAchievement: { type: Number, min: 0, max: 100 },
    peerFeedbackScore: { type: Number, min: 0, max: 100 },
    finalRating: { type: Number, min: 0, max: 100 },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'APPROVED'],
      default: 'DRAFT',
    },
    comments: String,
  },
  { timestamps: true }
);

export const PerformanceCycle = mongoose.model<IPerformanceCycle>('PerformanceCycle', performanceCycleSchema);
export const Goal = mongoose.model<IGoal>('Goal', goalSchema);
export const Appraisal = mongoose.model<IAppraisal>('Appraisal', appraisalSchema);
