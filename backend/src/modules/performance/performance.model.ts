import mongoose, { Schema, Document } from 'mongoose';

export type CycleStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
export type GoalOwnerType = 'TEAM' | 'INDIVIDUAL';
export type GoalStatus = 'ON_TRACK' | 'AHEAD' | 'AT_RISK' | 'OFF_TRACK';
export type SuggestionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
export type AppraisalStatus =
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'SUBMITTED_BY_EMPLOYEE'
  | 'SUBMITTED_BY_MANAGER'
  | 'COMPLETED'
  | 'CALIBRATED'
  | 'APPROVED';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED';
export type FeedbackAssignmentStatus = 'NOT_STARTED' | 'SENT' | 'IN_PROGRESS' | 'COMPLETED' | 'LOCKED';
export type FeedbackRaterStatus = 'SENT' | 'OPENED' | 'SUBMITTED';
export type FeedbackResponseStatus = 'DRAFT' | 'SUBMITTED';
export type BiasFlagType = 'MANAGER_OUTLIER' | 'GROUP_GAP' | 'DISTRIBUTION_ANOMALY';
export type BiasFlagStatus = 'OPEN' | 'REVIEWED' | 'DISMISSED' | 'ACTIONED';

export interface IPerformanceCycle extends Document {
  name: string;
  startDate: Date;
  endDate: Date;
  status: CycleStatus;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGoal extends Document {
  cycleId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  ownerType: GoalOwnerType;
  ownerId: mongoose.Types.ObjectId;
  weight: number;
  progress: number;
  status: GoalStatus;
  parentGoalId?: mongoose.Types.ObjectId | null;
  isSuggested: boolean;
  suggestionStatus: SuggestionStatus;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRatingFormulaConfig extends Document {
  cycleId: mongoose.Types.ObjectId;
  managerWeight: number;
  okrWeight: number;
  peerWeight: number;
  scale: number;
  okrMapping: {
    type: 'LINEAR';
    minPct: number;
    maxPct: number;
  };
  versionNumber: number;
  createdAt: Date;
}

export interface IMeritBand {
  name: string;
  minRating: number;
  maxRating: number;
  minIncreasePct: number;
  maxIncreasePct: number;
}

export interface IMeritMatrix extends Document {
  cycleId: mongoose.Types.ObjectId;
  bands: IMeritBand[];
  approvalChain: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IAppraisalApproval {
  stepName: string;
  status: ApprovalStatus;
  actorId?: mongoose.Types.ObjectId;
  actedAt?: Date;
  note?: string;
}

export interface IAppraisal extends Document {
  cycleId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  managerId?: mongoose.Types.ObjectId;
  status: AppraisalStatus;
  managerScore: number;
  okrAchievementPct: number;
  peerFeedbackScore: number;
  finalRating: number;
  formulaVersionNumber: number;
  selfAssessmentText?: string;
  managerAssessmentText?: string;
  approvals: IAppraisalApproval[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IFeedback360Question {
  id: string;
  type: 'LIKERT' | 'TEXT';
  prompt: string;
  required: boolean;
  scaleMin?: number;
  scaleMax?: number;
}

export interface IFeedback360Section {
  title: string;
  questions: IFeedback360Question[];
}

export interface IFeedback360Template extends Document {
  name: string;
  cycleId?: mongoose.Types.ObjectId;
  reusable: boolean;
  sections: IFeedback360Section[];
  settings: {
    anonymous: boolean;
    minResponsesToShow: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IFeedback360Rater {
  raterEmployeeId?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  roleType: 'MANAGER' | 'PEER' | 'DIRECT_REPORT' | 'SELF';
  tokenHash: string;
  status: FeedbackRaterStatus;
  openedAt?: Date;
  submittedAt?: Date;
}

export interface IFeedback360Assignment extends Document {
  cycleId: mongoose.Types.ObjectId;
  templateId: mongoose.Types.ObjectId;
  targetEmployeeId: mongoose.Types.ObjectId;
  requiredResponsesCount: number;
  deadlineAt?: Date;
  status: FeedbackAssignmentStatus;
  raters: IFeedback360Rater[];
  collectedResponsesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFeedback360Answer {
  questionId: string;
  value: number | string;
}

export interface IFeedback360Response extends Document {
  assignmentId: mongoose.Types.ObjectId;
  raterTokenHash?: string;
  raterEmployeeId?: mongoose.Types.ObjectId;
  answers: IFeedback360Answer[];
  status: FeedbackResponseStatus;
  submittedAt?: Date;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBiasFlag extends Document {
  cycleId: mongoose.Types.ObjectId;
  type: BiasFlagType;
  subjectId: string;
  metricName: string;
  metricValue: number;
  threshold: number;
  comparisonBaseline: number;
  status: BiasFlagStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuditEvent extends Document {
  entityType: string;
  entityId: string;
  action: string;
  actorId?: string;
  actorRole?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const performanceCycleSchema = new Schema<IPerformanceCycle>(
  {
    name: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED'],
      default: 'DRAFT',
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

performanceCycleSchema.index({ name: 1 }, { unique: true });

const goalSchema = new Schema<IGoal>(
  {
    cycleId: { type: Schema.Types.ObjectId, ref: 'PerformanceCycle', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    ownerType: { type: String, enum: ['TEAM', 'INDIVIDUAL'], required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, required: true, index: true },
    weight: { type: Number, required: true, min: 0, max: 100 },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    status: { type: String, enum: ['ON_TRACK', 'AHEAD', 'AT_RISK', 'OFF_TRACK'], default: 'ON_TRACK' },
    parentGoalId: { type: Schema.Types.ObjectId, ref: 'Goal', default: null },
    isSuggested: { type: Boolean, default: false },
    suggestionStatus: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED'], default: 'PENDING' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

goalSchema.index({ cycleId: 1, ownerType: 1, ownerId: 1 });

const ratingFormulaConfigSchema = new Schema<IRatingFormulaConfig>(
  {
    cycleId: { type: Schema.Types.ObjectId, ref: 'PerformanceCycle', required: true, index: true },
    managerWeight: { type: Number, required: true, min: 0, max: 1 },
    okrWeight: { type: Number, required: true, min: 0, max: 1 },
    peerWeight: { type: Number, required: true, min: 0, max: 1 },
    scale: { type: Number, default: 5, min: 1 },
    okrMapping: {
      type: {
        type: String,
        enum: ['LINEAR'],
        default: 'LINEAR',
      },
      minPct: { type: Number, default: 0 },
      maxPct: { type: Number, default: 100 },
    },
    versionNumber: { type: Number, required: true, min: 1 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ratingFormulaConfigSchema.index({ cycleId: 1, versionNumber: -1 });

const meritMatrixSchema = new Schema<IMeritMatrix>(
  {
    cycleId: { type: Schema.Types.ObjectId, ref: 'PerformanceCycle', required: true, unique: true },
    bands: [
      {
        name: { type: String, required: true },
        minRating: { type: Number, required: true, min: 0, max: 5 },
        maxRating: { type: Number, required: true, min: 0, max: 5 },
        minIncreasePct: { type: Number, required: true, min: 0 },
        maxIncreasePct: { type: Number, required: true, min: 0 },
      },
    ],
    approvalChain: [{ type: String, required: true }],
  },
  { timestamps: true }
);

const appraisalSchema = new Schema<IAppraisal>(
  {
    cycleId: { type: Schema.Types.ObjectId, ref: 'PerformanceCycle', required: true, index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    managerId: { type: Schema.Types.ObjectId, ref: 'Employee', index: true },
    status: {
      type: String,
      enum: ['DRAFT', 'IN_PROGRESS', 'SUBMITTED_BY_EMPLOYEE', 'SUBMITTED_BY_MANAGER', 'COMPLETED', 'CALIBRATED', 'APPROVED'],
      default: 'DRAFT',
      index: true,
    },
    managerScore: { type: Number, default: 0, min: 0, max: 5 },
    okrAchievementPct: { type: Number, default: 0, min: 0, max: 100 },
    peerFeedbackScore: { type: Number, default: 0, min: 0, max: 5 },
    finalRating: { type: Number, default: 0, min: 0, max: 5 },
    formulaVersionNumber: { type: Number, default: 1, min: 1 },
    selfAssessmentText: { type: String, default: '' },
    managerAssessmentText: { type: String, default: '' },
    approvals: [
      {
        stepName: { type: String, required: true },
        status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'SKIPPED'], default: 'PENDING' },
        actorId: { type: Schema.Types.ObjectId, ref: 'User' },
        actedAt: Date,
        note: String,
      },
    ],
  },
  { timestamps: true }
);

appraisalSchema.index({ cycleId: 1, employeeId: 1 }, { unique: true });

const feedback360TemplateSchema = new Schema<IFeedback360Template>(
  {
    name: { type: String, required: true, trim: true },
    cycleId: { type: Schema.Types.ObjectId, ref: 'PerformanceCycle', index: true },
    reusable: { type: Boolean, default: false },
    sections: [
      {
        title: { type: String, required: true },
        questions: [
          {
            id: { type: String, required: true },
            type: { type: String, enum: ['LIKERT', 'TEXT'], required: true },
            prompt: { type: String, required: true },
            required: { type: Boolean, default: false },
            scaleMin: Number,
            scaleMax: Number,
          },
        ],
      },
    ],
    settings: {
      anonymous: { type: Boolean, default: true },
      minResponsesToShow: { type: Number, default: 3, min: 1 },
    },
  },
  { timestamps: true }
);

const feedback360AssignmentSchema = new Schema<IFeedback360Assignment>(
  {
    cycleId: { type: Schema.Types.ObjectId, ref: 'PerformanceCycle', required: true, index: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'Feedback360Template', required: true },
    targetEmployeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    requiredResponsesCount: { type: Number, required: true, min: 1 },
    deadlineAt: Date,
    status: {
      type: String,
      enum: ['NOT_STARTED', 'SENT', 'IN_PROGRESS', 'COMPLETED', 'LOCKED'],
      default: 'NOT_STARTED',
      index: true,
    },
    raters: [
      {
        raterEmployeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
        name: { type: String, required: true },
        email: { type: String, required: true, lowercase: true },
        roleType: { type: String, enum: ['MANAGER', 'PEER', 'DIRECT_REPORT', 'SELF'], required: true },
        tokenHash: { type: String, required: true },
        status: { type: String, enum: ['SENT', 'OPENED', 'SUBMITTED'], default: 'SENT' },
        openedAt: Date,
        submittedAt: Date,
      },
    ],
    collectedResponsesCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

feedback360AssignmentSchema.index({ cycleId: 1, targetEmployeeId: 1 }, { unique: true });

const feedback360ResponseSchema = new Schema<IFeedback360Response>(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Feedback360Assignment', required: true, index: true },
    raterTokenHash: { type: String, index: true },
    raterEmployeeId: { type: Schema.Types.ObjectId, ref: 'Employee', index: true },
    answers: [
      {
        questionId: { type: String, required: true },
        value: { type: Schema.Types.Mixed, required: true },
      },
    ],
    status: { type: String, enum: ['DRAFT', 'SUBMITTED'], default: 'DRAFT', index: true },
    submittedAt: Date,
    ip: String,
    userAgent: String,
  },
  { timestamps: true }
);

feedback360ResponseSchema.index({ assignmentId: 1, raterTokenHash: 1 }, { unique: true, sparse: true });

const biasFlagSchema = new Schema<IBiasFlag>(
  {
    cycleId: { type: Schema.Types.ObjectId, ref: 'PerformanceCycle', required: true, index: true },
    type: { type: String, enum: ['MANAGER_OUTLIER', 'GROUP_GAP', 'DISTRIBUTION_ANOMALY'], required: true, index: true },
    subjectId: { type: String, required: true },
    metricName: { type: String, required: true },
    metricValue: { type: Number, required: true },
    threshold: { type: Number, required: true },
    comparisonBaseline: { type: Number, required: true },
    status: { type: String, enum: ['OPEN', 'REVIEWED', 'DISMISSED', 'ACTIONED'], default: 'OPEN', index: true },
    notes: String,
  },
  { timestamps: true }
);

const auditEventSchema = new Schema<IAuditEvent>(
  {
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, required: true, index: true },
    action: { type: String, required: true },
    actorId: { type: String },
    actorRole: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const PerformanceCycle = mongoose.model<IPerformanceCycle>('PerformanceCycle', performanceCycleSchema);
export const Goal = mongoose.model<IGoal>('Goal', goalSchema);
export const RatingFormulaConfig = mongoose.model<IRatingFormulaConfig>('RatingFormulaConfig', ratingFormulaConfigSchema);
export const MeritMatrix = mongoose.model<IMeritMatrix>('MeritMatrix', meritMatrixSchema);
export const Appraisal = mongoose.model<IAppraisal>('Appraisal', appraisalSchema);
export const Feedback360Template = mongoose.model<IFeedback360Template>('Feedback360Template', feedback360TemplateSchema);
export const Feedback360Assignment = mongoose.model<IFeedback360Assignment>('Feedback360Assignment', feedback360AssignmentSchema);
export const Feedback360Response = mongoose.model<IFeedback360Response>('Feedback360Response', feedback360ResponseSchema);
export const BiasFlag = mongoose.model<IBiasFlag>('BiasFlag', biasFlagSchema);
export const AuditEvent = mongoose.model<IAuditEvent>('AuditEvent', auditEventSchema);