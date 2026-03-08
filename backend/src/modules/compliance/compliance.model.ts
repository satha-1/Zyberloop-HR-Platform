import mongoose, { Schema, Document } from 'mongoose';

// ============================================================================
// COMPLIANCE FILING TYPE
// ============================================================================
export type DueDateRule = 'LAST_WORKING_DAY_NEXT_MONTH' | 'LAST_DAY_NEXT_MONTH' | 'FIXED_DAY_NEXT_MONTH';

export interface IComplianceFilingType extends Document {
  code: string; // "EPF", "ETF", "EPF_ETF", etc.
  name: string;
  country: string; // ISO2, default "LK"
  dueDateRule: DueDateRule;
  internalDueDayOfMonth: number | null; // e.g., 15 for 15th of next month
  currency: string; // default "LKR"
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const complianceFilingTypeSchema = new Schema<IComplianceFilingType>(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true },
    country: { type: String, default: 'LK', uppercase: true },
    dueDateRule: {
      type: String,
      enum: ['LAST_WORKING_DAY_NEXT_MONTH', 'LAST_DAY_NEXT_MONTH', 'FIXED_DAY_NEXT_MONTH'],
      default: 'LAST_WORKING_DAY_NEXT_MONTH',
    },
    internalDueDayOfMonth: { type: Number, min: 1, max: 31, default: null },
    currency: { type: String, default: 'LKR', uppercase: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ComplianceFilingType = mongoose.model<IComplianceFilingType>(
  'ComplianceFilingType',
  complianceFilingTypeSchema
);

// ============================================================================
// COMPLIANCE FILING PERIOD
// ============================================================================
export interface IComplianceFilingPeriod extends Document {
  year: number;
  month: number; // 1-12
  label: string; // e.g., "February 2026"
  createdAt: Date;
  updatedAt: Date;
}

const complianceFilingPeriodSchema = new Schema<IComplianceFilingPeriod>(
  {
    year: { type: Number, required: true, min: 2000, max: 2100 },
    month: { type: Number, required: true, min: 1, max: 12 },
    label: { type: String, required: true },
  },
  { timestamps: true }
);

// Unique index on year + month
complianceFilingPeriodSchema.index({ year: 1, month: 1 }, { unique: true });

export const ComplianceFilingPeriod = mongoose.model<IComplianceFilingPeriod>(
  'ComplianceFilingPeriod',
  complianceFilingPeriodSchema
);

// ============================================================================
// COMPLIANCE ASSET (Generic file record for S3)
// ============================================================================
export interface IComplianceAsset extends Document {
  bucket: string;
  s3Key: string;
  fileName: string;
  mimeType: string;
  size: number;
  sha256: string;
  immutable: {
    objectLockEnabled: boolean;
    mode: 'GOVERNANCE' | 'COMPLIANCE' | null;
    retainUntil: Date | null;
    legalHold: 'ON' | 'OFF' | null;
  };
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const complianceAssetSchema = new Schema<IComplianceAsset>(
  {
    bucket: { type: String, required: true },
    s3Key: { type: String, required: true, unique: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
    sha256: { type: String, required: true },
    immutable: {
      objectLockEnabled: { type: Boolean, default: false },
      mode: { type: String, enum: ['GOVERNANCE', 'COMPLIANCE'], default: null },
      retainUntil: { type: Date, default: null },
      legalHold: { type: String, enum: ['ON', 'OFF'], default: null },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const ComplianceAsset = mongoose.model<IComplianceAsset>('ComplianceAsset', complianceAssetSchema);

// ============================================================================
// COMPLIANCE FILING
// ============================================================================
export type FilingStatus = 'DRAFT' | 'PENDING' | 'FILED' | 'OVERDUE';

export interface IComplianceFiling extends Document {
  filingTypeId: mongoose.Types.ObjectId;
  periodId: mongoose.Types.ObjectId;
  statutoryDueDate: Date;
  internalDueDate: Date | null;
  amount: number;
  status: FilingStatus;
  filedAt: Date | null;
  paymentReference: string | null;
  reportAssets: mongoose.Types.ObjectId[];
  receiptAssets: mongoose.Types.ObjectId[];
  notes: string | null;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const complianceFilingSchema = new Schema<IComplianceFiling>(
  {
    filingTypeId: { type: Schema.Types.ObjectId, ref: 'ComplianceFilingType', required: true },
    periodId: { type: Schema.Types.ObjectId, ref: 'ComplianceFilingPeriod', required: true },
    statutoryDueDate: { type: Date, required: true },
    internalDueDate: { type: Date, default: null },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING', 'FILED', 'OVERDUE'],
      default: 'PENDING',
    },
    filedAt: { type: Date, default: null },
    paymentReference: { type: String, default: null },
    reportAssets: [{ type: Schema.Types.ObjectId, ref: 'ComplianceAsset' }],
    receiptAssets: [{ type: Schema.Types.ObjectId, ref: 'ComplianceAsset' }],
    notes: { type: String, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

// Unique index: one filing per type + period
complianceFilingSchema.index({ filingTypeId: 1, periodId: 1 }, { unique: true });
complianceFilingSchema.index({ status: 1 });
complianceFilingSchema.index({ statutoryDueDate: 1 });

export const ComplianceFiling = mongoose.model<IComplianceFiling>('ComplianceFiling', complianceFilingSchema);

// ============================================================================
// COMPLIANCE PERMIT (Work visas & permits)
// ============================================================================
export type PermitStatus = 'ACTIVE' | 'RENEWAL_IN_PROGRESS' | 'EXPIRED' | 'CANCELLED';

export interface ICompliancePermit extends Document {
  employeeId: mongoose.Types.ObjectId;
  permitType: string; // e.g., "Work Permit", "Residence Visa", "H1-B"
  country: string; // ISO2
  identifier: string | null; // permit/visa number
  expiresAt: Date;
  status: PermitStatus;
  ownerUserId: mongoose.Types.ObjectId | null; // HR owner
  documentAssets: mongoose.Types.ObjectId[];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const compliancePermitSchema = new Schema<ICompliancePermit>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    permitType: { type: String, required: true },
    country: { type: String, required: true, uppercase: true },
    identifier: { type: String, default: null },
    expiresAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'RENEWAL_IN_PROGRESS', 'EXPIRED', 'CANCELLED'],
      default: 'ACTIVE',
    },
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    documentAssets: [{ type: Schema.Types.ObjectId, ref: 'ComplianceAsset' }],
    notes: { type: String, default: null },
  },
  { timestamps: true }
);

compliancePermitSchema.index({ expiresAt: 1 });
compliancePermitSchema.index({ employeeId: 1 });
compliancePermitSchema.index({ status: 1 });

export const CompliancePermit = mongoose.model<ICompliancePermit>('CompliancePermit', compliancePermitSchema);

// ============================================================================
// COMPLIANCE AUDIT REPORT
// ============================================================================
export type AuditCategory = 'STATUTORY' | 'INTERNAL' | 'GDPR' | 'OTHER';
export type AuditStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';

export interface IComplianceAuditReport extends Document {
  title: string;
  category: AuditCategory;
  status: AuditStatus;
  completedAt: Date | null;
  evidenceAssets: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const complianceAuditReportSchema = new Schema<IComplianceAuditReport>(
  {
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ['STATUTORY', 'INTERNAL', 'GDPR', 'OTHER'],
      required: true,
    },
    status: {
      type: String,
      enum: ['PLANNED', 'IN_PROGRESS', 'COMPLETED'],
      default: 'PLANNED',
    },
    completedAt: { type: Date, default: null },
    evidenceAssets: [{ type: Schema.Types.ObjectId, ref: 'ComplianceAsset' }],
  },
  { timestamps: true }
);

export const ComplianceAuditReport = mongoose.model<IComplianceAuditReport>(
  'ComplianceAuditReport',
  complianceAuditReportSchema
);

// ============================================================================
// COMPLIANCE ALERT
// ============================================================================
export type AlertType = 'VISA_EXPIRY' | 'FILING_DUE' | 'FILING_OVERDUE' | 'MISSING_RECEIPT';
export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type AlertEntityType = 'FILING' | 'PERMIT' | 'AUDIT';

export interface IComplianceAlert extends Document {
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  entityType: AlertEntityType;
  entityId: mongoose.Types.ObjectId;
  dueAt: Date | null;
  resolved: boolean;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const complianceAlertSchema = new Schema<IComplianceAlert>(
  {
    type: {
      type: String,
      enum: ['VISA_EXPIRY', 'FILING_DUE', 'FILING_OVERDUE', 'MISSING_RECEIPT'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
      required: true,
    },
    message: { type: String, required: true },
    entityType: {
      type: String,
      enum: ['FILING', 'PERMIT', 'AUDIT'],
      required: true,
    },
    entityId: { type: Schema.Types.ObjectId, required: true },
    dueAt: { type: Date, default: null },
    resolved: { type: Boolean, default: false },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Index for efficient alert queries
complianceAlertSchema.index({ resolved: 1, severity: 1 });
complianceAlertSchema.index({ entityType: 1, entityId: 1 });
complianceAlertSchema.index({ type: 1, entityType: 1, entityId: 1, resolved: 1 }, { unique: true, sparse: true });

export const ComplianceAlert = mongoose.model<IComplianceAlert>('ComplianceAlert', complianceAlertSchema);

// ============================================================================
// COMPLIANCE AUTOMATION RULE
// ============================================================================
export type AutomationType = 'EPF_ETF_AUTOFILING' | 'BANK_RECON' | 'HR_CHATBOT' | 'OTHER';
export type AutomationRunStatus = 'SUCCESS' | 'FAILED' | 'SKIPPED' | null;

export interface IComplianceAutomationRule extends Document {
  name: string;
  type: AutomationType;
  active: boolean;
  scheduleCron: string | null;
  lastRunAt: Date | null;
  lastRunStatus: AutomationRunStatus;
  lastRunLog: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const complianceAutomationRuleSchema = new Schema<IComplianceAutomationRule>(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['EPF_ETF_AUTOFILING', 'BANK_RECON', 'HR_CHATBOT', 'OTHER'],
      required: true,
    },
    active: { type: Boolean, default: false },
    scheduleCron: { type: String, default: null },
    lastRunAt: { type: Date, default: null },
    lastRunStatus: { type: String, enum: ['SUCCESS', 'FAILED', 'SKIPPED'], default: null },
    lastRunLog: { type: String, default: null },
  },
  { timestamps: true }
);

export const ComplianceAutomationRule = mongoose.model<IComplianceAutomationRule>(
  'ComplianceAutomationRule',
  complianceAutomationRuleSchema
);
