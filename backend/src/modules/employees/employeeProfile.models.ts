import mongoose, { Schema, Document } from 'mongoose';

// Service Dates Model
export interface IEmployeeServiceDates extends Document {
  employeeId: mongoose.Types.ObjectId;
  hireDate: Date;
  originalHireDate?: Date;
  continuousServiceDate?: Date;
  benefitServiceDate?: Date;
  companyServiceDate?: Date;
  seniorityDate?: Date;
  unionSeniorityDate?: Date;
  probationEndDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const employeeServiceDatesSchema = new Schema<IEmployeeServiceDates>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      unique: true,
      index: true,
    },
    hireDate: { type: Date, required: true },
    originalHireDate: Date,
    continuousServiceDate: Date,
    benefitServiceDate: Date,
    companyServiceDate: Date,
    seniorityDate: Date,
    unionSeniorityDate: Date,
    probationEndDate: Date,
  },
  { timestamps: true }
);

export const EmployeeServiceDates = mongoose.model<IEmployeeServiceDates>(
  'EmployeeServiceDates',
  employeeServiceDatesSchema
);

// Assigned Roles Model
export interface IEmployeeAssignedRole extends Document {
  employeeId: mongoose.Types.ObjectId;
  roleName: string;
  organizationName: string;
  organizationType: string;
  dateAssigned: Date;
  createdAt: Date;
  updatedAt: Date;
}

const employeeAssignedRoleSchema = new Schema<IEmployeeAssignedRole>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    roleName: { type: String, required: true },
    organizationName: { type: String, required: true },
    organizationType: { type: String, required: true },
    dateAssigned: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

export const EmployeeAssignedRole = mongoose.model<IEmployeeAssignedRole>(
  'EmployeeAssignedRole',
  employeeAssignedRoleSchema
);

// Support Roles Model
export interface IEmployeeSupportRole extends Document {
  employeeId: mongoose.Types.ObjectId;
  assignableRole: string;
  workerName: string;
  organization: string;
  roleEnabledDescription?: string;
  effectiveStartDate?: Date;
  effectiveEndDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const employeeSupportRoleSchema = new Schema<IEmployeeSupportRole>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    assignableRole: { type: String, required: true },
    workerName: { type: String, required: true },
    organization: { type: String, required: true },
    roleEnabledDescription: String,
    effectiveStartDate: Date,
    effectiveEndDate: Date,
  },
  { timestamps: true }
);

export const EmployeeSupportRole = mongoose.model<IEmployeeSupportRole>(
  'EmployeeSupportRole',
  employeeSupportRoleSchema
);

// Organizations Model
export interface IEmployeeOrganization extends Document {
  employeeId: mongoose.Types.ObjectId;
  organizationName: string;
  organizationType: string;
  organizationSubtype?: string;
  createdAt: Date;
  updatedAt: Date;
}

const employeeOrganizationSchema = new Schema<IEmployeeOrganization>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    organizationName: { type: String, required: true },
    organizationType: { type: String, required: true },
    organizationSubtype: String,
  },
  { timestamps: true }
);

export const EmployeeOrganization = mongoose.model<IEmployeeOrganization>(
  'EmployeeOrganization',
  employeeOrganizationSchema
);

// Compensation Profile Model
export interface IEmployeeCompensationProfile extends Document {
  employeeId: mongoose.Types.ObjectId;
  compensationPackageName?: string;
  compensationGrade?: string;
  gradeProfile?: string;
  company?: string;
  currency: string;
  planAssignments: Array<{
    effectiveDate: Date;
    planType: string;
    compensationPlan: string;
    assignmentDescription?: string;
    annualAmountLKR: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const employeeCompensationProfileSchema = new Schema<IEmployeeCompensationProfile>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      unique: true,
      index: true,
    },
    compensationPackageName: String,
    compensationGrade: String,
    gradeProfile: String,
    company: String,
    currency: { type: String, default: 'LKR' },
    planAssignments: [
      {
        effectiveDate: { type: Date, required: true },
        planType: { type: String, required: true },
        compensationPlan: { type: String, required: true },
        assignmentDescription: String,
        annualAmountLKR: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

export const EmployeeCompensationProfile = mongoose.model<IEmployeeCompensationProfile>(
  'EmployeeCompensationProfile',
  employeeCompensationProfileSchema
);

// Job History Model
export interface IEmployeeJobHistory extends Document {
  employeeId: mongoose.Types.ObjectId;
  jobTitle: string;
  company?: string;
  startDate: Date;
  endDate?: Date;
  achievements?: string;
  responsibilitiesText?: string;
  createdAt: Date;
  updatedAt: Date;
}

const employeeJobHistorySchema = new Schema<IEmployeeJobHistory>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    jobTitle: { type: String, required: true },
    company: String,
    startDate: { type: Date, required: true },
    endDate: Date,
    achievements: String,
    responsibilitiesText: String,
  },
  { timestamps: true }
);

export const EmployeeJobHistory = mongoose.model<IEmployeeJobHistory>(
  'EmployeeJobHistory',
  employeeJobHistorySchema
);

// External Interactions Model
export interface IEmployeeExternalInteractions extends Document {
  employeeId: mongoose.Types.ObjectId;
  answers: Record<string, any>; // Flexible JSON structure for questionnaire
  createdAt: Date;
  updatedAt: Date;
}

const employeeExternalInteractionsSchema = new Schema<IEmployeeExternalInteractions>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      unique: true,
      index: true,
    },
    answers: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const EmployeeExternalInteractions = mongoose.model<IEmployeeExternalInteractions>(
  'EmployeeExternalInteractions',
  employeeExternalInteractionsSchema
);

// Additional Data Model
export interface IEmployeeAdditionalData extends Document {
  employeeId: mongoose.Types.ObjectId;
  dataGroups: Record<string, any>; // Flexible JSON structure
  createdAt: Date;
  updatedAt: Date;
}

const employeeAdditionalDataSchema = new Schema<IEmployeeAdditionalData>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      unique: true,
      index: true,
    },
    dataGroups: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const EmployeeAdditionalData = mongoose.model<IEmployeeAdditionalData>(
  'EmployeeAdditionalData',
  employeeAdditionalDataSchema
);

// Benefits Enrollment Model
export interface IEmployeeBenefit extends Document {
  employeeId: mongoose.Types.ObjectId;
  benefitType: string;
  planName: string;
  provider?: string;
  effectiveDate: Date;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  createdAt: Date;
  updatedAt: Date;
}

const employeeBenefitSchema = new Schema<IEmployeeBenefit>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    benefitType: { type: String, required: true },
    planName: { type: String, required: true },
    provider: String,
    effectiveDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'PENDING'],
      default: 'ACTIVE',
    },
  },
  { timestamps: true }
);

export const EmployeeBenefit = mongoose.model<IEmployeeBenefit>(
  'EmployeeBenefit',
  employeeBenefitSchema
);
