import { WorkforcePlanningScenario, WorkforcePlanningInput } from './workforcePlanning.model';
import { AppError } from '../../middlewares/errorHandler';

/**
 * Calculate scenario impact summary
 */
export async function calculateScenarioImpact(scenarioId: string): Promise<{
  currentHeadcount: number;
  targetHeadcount: number;
  netChange: number;
  annualCost: number;
  costPerHead: number;
  monthlyHiringCapacityRange: { min: number; max: number };
  attritionImpactEstimate: number;
}> {
  const scenario = await WorkforcePlanningScenario.findById(scenarioId);
  if (!scenario) {
    throw new AppError(404, 'Scenario not found');
  }

  // Get active planning input for fallback values
  const activeInput = await WorkforcePlanningInput.findOne({ isActive: true }).lean();

  // Calculate cost per head
  const costPerHead = scenario.targetHeadcount > 0
    ? scenario.annualCost / scenario.targetHeadcount
    : 0;

  // Determine hiring capacity range
  let monthlyHiringCapacityRange: { min: number; max: number };
  if (
    scenario.projectedHiringPerMonthMin !== null &&
    scenario.projectedHiringPerMonthMin !== undefined &&
    scenario.projectedHiringPerMonthMax !== null &&
    scenario.projectedHiringPerMonthMax !== undefined
  ) {
    monthlyHiringCapacityRange = {
      min: scenario.projectedHiringPerMonthMin,
      max: scenario.projectedHiringPerMonthMax,
    };
  } else if (activeInput) {
    monthlyHiringCapacityRange = {
      min: activeInput.hiringVelocityMinPerMonth || 0,
      max: activeInput.hiringVelocityMaxPerMonth || 0,
    };
  } else {
    monthlyHiringCapacityRange = { min: 0, max: 0 };
  }

  // Calculate attrition impact
  let attritionPct: number;
  if (scenario.projectedAttritionPct !== null && scenario.projectedAttritionPct !== undefined) {
    attritionPct = scenario.projectedAttritionPct;
  } else if (activeInput) {
    attritionPct = activeInput.attritionForecastPct;
  } else {
    attritionPct = 0;
  }

  const attritionImpactEstimate = Math.round(scenario.currentHeadcount * (attritionPct / 100));

  return {
    currentHeadcount: scenario.currentHeadcount,
    targetHeadcount: scenario.targetHeadcount,
    netChange: scenario.netChange,
    annualCost: scenario.annualCost,
    costPerHead: Math.round(costPerHead * 100) / 100,
    monthlyHiringCapacityRange,
    attritionImpactEstimate,
  };
}

/**
 * Activate a scenario (only one can be active at a time)
 * Only APPROVED scenarios can be activated
 */
export async function activateScenario(scenarioId: string): Promise<void> {
  const scenario = await WorkforcePlanningScenario.findById(scenarioId);
  if (!scenario) {
    throw new AppError(404, 'Scenario not found');
  }

  if (scenario.status !== 'APPROVED') {
    throw new AppError(400, 'Only APPROVED scenarios can be activated');
  }

  // Find and freeze any currently active scenario
  const activeScenario = await WorkforcePlanningScenario.findOne({ status: 'ACTIVE' });
  if (activeScenario && activeScenario._id.toString() !== scenarioId) {
    activeScenario.status = 'FROZEN';
    await activeScenario.save();
  }

  scenario.status = 'ACTIVE';
  await scenario.save();
}

/**
 * Activate a planning input (only one can be active at a time)
 */
export async function activatePlanningInput(inputId: string): Promise<void> {
  const input = await WorkforcePlanningInput.findById(inputId);
  if (!input) {
    throw new AppError(404, 'Planning input not found');
  }

  // Deactivate all other inputs
  await WorkforcePlanningInput.updateMany(
    { _id: { $ne: inputId } },
    { $set: { isActive: false } }
  );

  input.isActive = true;
  await input.save();
}
