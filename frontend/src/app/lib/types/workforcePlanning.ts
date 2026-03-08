export type ScenarioStatus = 'DRAFT' | 'ACTIVE' | 'FROZEN' | 'ARCHIVED';
export type FinanceApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

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
