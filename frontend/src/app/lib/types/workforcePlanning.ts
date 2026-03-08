export type ScenarioStatus = 'DRAFT' | 'SUBMITTED_FOR_APPROVAL' | 'UNDER_REVIEW' | 'APPROVED' | 'ACTIVE' | 'REJECTED' | 'FROZEN' | 'ARCHIVED';
export type FinanceApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ApprovalAction = 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface ApprovalHistory {
  action: ApprovalAction;
  userId: {
    _id: string;
    name?: string;
    email?: string;
  };
  timestamp: string;
  comment?: string;
}

export interface Approval {
  submittedBy?: {
    _id: string;
    name?: string;
    email?: string;
  };
  submittedAt?: string;
  reviewerId?: {
    _id: string;
    name?: string;
    email?: string;
  };
  reviewedAt?: string;
  decision?: 'APPROVED' | 'REJECTED' | null;
  comments?: string;
}

export interface WorkforcePlanningScenario {
  _id: string;
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
  approval?: Approval;
  approvalHistory?: ApprovalHistory[];
  createdBy?: {
    _id: string;
    name?: string;
    email?: string;
  };
  updatedBy?: {
    _id: string;
    name?: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface WorkforcePlanningInput {
  _id: string;
  annualBudget: number;
  financeApprovalStatus: FinanceApprovalStatus;
  financeApprovalNote?: string;
  hiringVelocityMinPerMonth: number;
  hiringVelocityMaxPerMonth: number;
  attritionForecastPct: number;
  effectiveFrom?: string | null;
  isActive: boolean;
  createdBy?: {
    _id: string;
    name?: string;
    email?: string;
  };
  updatedBy?: {
    _id: string;
    name?: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ScenarioImpact {
  currentHeadcount: number;
  targetHeadcount: number;
  netChange: number;
  annualCost: number;
  costPerHead: number;
  monthlyHiringCapacityRange: {
    min: number;
    max: number;
  };
  attritionImpactEstimate: number;
}

export interface WorkforcePlanningSummary {
  totalScenarios: number;
  activeScenarioCount: number;
  activeScenario: WorkforcePlanningScenario | null;
  activePlanningInput: WorkforcePlanningInput | null;
}
