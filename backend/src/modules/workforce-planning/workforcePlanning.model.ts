import mongoose, { Schema, Document } from 'mongoose';

export type ScenarioStatus = 'DRAFT' | 'SUBMITTED_FOR_APPROVAL' | 'UNDER_REVIEW' | 'APPROVED' | 'ACTIVE' | 'REJECTED' | 'FROZEN' | 'ARCHIVED';
export type FinanceApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ApprovalAction = 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface IApprovalHistory {
  action: ApprovalAction;
  userId: mongoose.Types.ObjectId;
  timestamp: Date;
  comment?: string;
}

export interface IApproval {
  submittedBy?: mongoose.Types.ObjectId;
  submittedAt?: Date;
  reviewerId?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  decision?: 'APPROVED' | 'REJECTED' | null;
  comments?: string;
}

export interface IWorkforcePlanningScenario extends Document {
  name: string;
  description?: string;
  status: ScenarioStatus;
  targetHeadcount: number;
  currentHeadcount: number;
  netChange: number;
  annualCost: number;
  durationMonths: number;
  notes?: string;
  projectedAttritionPct?: number | null;
  projectedHiringPerMonthMin?: number | null;
  projectedHiringPerMonthMax?: number | null;
  approval?: IApproval;
  approvalHistory?: IApprovalHistory[];
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkforcePlanningInput extends Document {
  annualBudget: number;
  financeApprovalStatus: FinanceApprovalStatus;
  financeApprovalNote?: string;
  hiringVelocityMinPerMonth: number;
  hiringVelocityMaxPerMonth: number;
  attritionForecastPct: number;
  effectiveFrom?: Date | null;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const workforcePlanningScenarioSchema = new Schema<IWorkforcePlanningScenario>(
  {
    name: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED_FOR_APPROVAL', 'UNDER_REVIEW', 'APPROVED', 'ACTIVE', 'REJECTED', 'FROZEN', 'ARCHIVED'],
      default: 'DRAFT',
      index: true,
    },
    targetHeadcount: { type: Number, required: true, min: 0 },
    currentHeadcount: { type: Number, required: true, min: 0 },
    netChange: { type: Number, default: 0 },
    annualCost: { type: Number, required: true, min: 0 },
    durationMonths: { type: Number, default: 12, min: 1 },
    notes: { type: String, default: '' },
    projectedAttritionPct: { type: Number, default: null, min: 0, max: 100 },
    projectedHiringPerMonthMin: { type: Number, default: null, min: 0 },
    projectedHiringPerMonthMax: { type: Number, default: null, min: 0 },
    approval: {
      submittedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      submittedAt: { type: Date },
      reviewerId: { type: Schema.Types.ObjectId, ref: 'User' },
      reviewedAt: { type: Date },
      decision: { type: String, enum: ['APPROVED', 'REJECTED'], default: null },
      comments: { type: String, default: '' },
    },
    approvalHistory: [
      {
        action: { type: String, enum: ['SUBMITTED', 'APPROVED', 'REJECTED'], required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        timestamp: { type: Date, default: Date.now },
        comment: { type: String, default: '' },
      },
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Pre-save hook to calculate netChange
workforcePlanningScenarioSchema.pre('save', function (next) {
  this.netChange = this.targetHeadcount - this.currentHeadcount;
  next();
});

// Index for active scenario queries
workforcePlanningScenarioSchema.index({ status: 1, createdAt: -1 });

const workforcePlanningInputSchema = new Schema<IWorkforcePlanningInput>(
  {
    annualBudget: { type: Number, required: true, min: 0 },
    financeApprovalStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    financeApprovalNote: { type: String, default: '' },
    hiringVelocityMinPerMonth: { type: Number, required: true, min: 0 },
    hiringVelocityMaxPerMonth: { type: Number, required: true, min: 0 },
    attritionForecastPct: { type: Number, required: true, min: 0, max: 100 },
    effectiveFrom: { type: Date, default: null },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Validation: min <= max
workforcePlanningInputSchema.pre('save', function (next) {
  if (this.hiringVelocityMinPerMonth > this.hiringVelocityMaxPerMonth) {
    next(new Error('hiringVelocityMinPerMonth must be <= hiringVelocityMaxPerMonth'));
  } else {
    next();
  }
});

// Index for active input queries
workforcePlanningInputSchema.index({ isActive: 1, createdAt: -1 });

export const WorkforcePlanningScenario = mongoose.model<IWorkforcePlanningScenario>(
  'WorkforcePlanningScenario',
  workforcePlanningScenarioSchema
);

export const WorkforcePlanningInput = mongoose.model<IWorkforcePlanningInput>(
  'WorkforcePlanningInput',
  workforcePlanningInputSchema
);
