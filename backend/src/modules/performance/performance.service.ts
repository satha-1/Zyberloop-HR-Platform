import { Request } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import {
  PerformanceCycle,
  Goal,
  RatingFormulaConfig,
  MeritMatrix,
  Appraisal,
  Feedback360Template,
  Feedback360Assignment,
  Feedback360Response,
  BiasFlag,
  AuditEvent,
  IAppraisal,
} from './performance.model';
import { Employee } from '../employees/employee.model';
import { AppError } from '../../middlewares/errorHandler';

// â”€â”€â”€ Audit helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function auditPerf(
  entityType: string,
  entityId: string,
  action: string,
  req: Request
) {
  try {
    await AuditEvent.create({
      entityType,
      entityId,
      action,
      actorId: req.user?.id,
      actorRole: (req.user?.roles ?? []).join(','),
    });
  } catch (_) { /* non-blocking */ }
}

// â”€â”€â”€ OKR compute â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function computeOkrAchievement(cycleId: string, employeeId: string): Promise<number> {
  const goals = await Goal.find({
    cycleId,
    ownerType: 'INDIVIDUAL',
    ownerId: new mongoose.Types.ObjectId(employeeId),
    isSuggested: false,
  }).lean();

  if (!goals.length) return 0;
  const totalWeight = goals.reduce((s, g) => s + g.weight, 0);
  if (!totalWeight) return 0;
  const weighted = goals.reduce((s, g) => s + (g.progress * g.weight) / 100, 0);
  return Math.round((weighted / totalWeight) * 100 * 10) / 10;
}

// â”€â”€â”€ Final rating compute â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function computeFinalRating(appraisal: IAppraisal): Promise<{ finalRating: number; version: number }> {
  const formula = await RatingFormulaConfig.findOne({ cycleId: appraisal.cycleId })
    .sort({ versionNumber: -1 })
    .lean();

  const mW = formula?.managerWeight ?? 0.5;
  const oW = formula?.okrWeight ?? 0.3;
  const pW = formula?.peerWeight ?? 0.2;
  const version = formula?.versionNumber ?? 1;

  const okrScore = ((appraisal.okrAchievementPct ?? 0) / 100) * 5;
  const raw = mW * (appraisal.managerScore ?? 0) + oW * okrScore + pW * (appraisal.peerFeedbackScore ?? 0);
  return { finalRating: Math.round(raw * 100) / 100, version };
}

// â”€â”€â”€ Peer score from 360 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function computePeerScore(assignmentId: string): Promise<number> {
  const responses = await Feedback360Response.find({
    assignmentId: new mongoose.Types.ObjectId(assignmentId),
    status: 'SUBMITTED',
  }).lean();

  if (!responses.length) return 0;
  const nums: number[] = [];
  for (const r of responses) {
    for (const ans of r.answers) {
      const v = Number(ans.value);
      if (!isNaN(v)) nums.push(v);
    }
  }
  if (!nums.length) return 0;
  const avg = nums.reduce((s, n) => s + n, 0) / nums.length;
  return Math.round((avg / 5) * 5 * 100) / 100; // map to 0-5
}

// â”€â”€â”€ Bias detection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function runBiasDetection(cycleId: string, threshold = 0.8): Promise<void> {
  const appraisals = await Appraisal.find({ cycleId, finalRating: { $gt: 0 } }).lean();
  if (!appraisals.length) return;

  const orgAvg = appraisals.reduce((s, a) => s + (a.finalRating ?? 0), 0) / appraisals.length;

  // Manager outlier: group by managerId
  const byManager: Record<string, number[]> = {};
  for (const a of appraisals) {
    if (!a.managerId) continue;
    const k = a.managerId.toString();
    if (!byManager[k]) byManager[k] = [];
    byManager[k].push(a.finalRating ?? 0);
  }

  for (const [managerId, ratings] of Object.entries(byManager)) {
    if (ratings.length < 2) continue;
    const mgrAvg = ratings.reduce((s, r) => s + r, 0) / ratings.length;
    const diff = Math.abs(mgrAvg - orgAvg);
    if (diff >= threshold) {
      const existing = await BiasFlag.findOne({ cycleId, type: 'MANAGER_OUTLIER', subjectId: managerId });
      if (!existing) {
        await BiasFlag.create({
          cycleId,
          type: 'MANAGER_OUTLIER',
          subjectId: managerId,
          metricName: 'avg_final_rating',
          metricValue: Math.round(mgrAvg * 100) / 100,
          threshold,
          comparisonBaseline: Math.round(orgAvg * 100) / 100,
          status: 'OPEN',
        });
      }
    }
  }

  // Department/group gap
  const empIds = [...new Set(appraisals.map((a) => a.employeeId.toString()))];
  const employees = await Employee.find({ _id: { $in: empIds } }).select('_id departmentId').lean();
  const empDeptMap: Record<string, string> = {};
  employees.forEach((e: any) => { if (e.departmentId) empDeptMap[e._id.toString()] = e.departmentId.toString(); });

  const byDept: Record<string, number[]> = {};
  for (const a of appraisals) {
    const deptId = empDeptMap[a.employeeId.toString()];
    if (!deptId) continue;
    if (!byDept[deptId]) byDept[deptId] = [];
    byDept[deptId].push(a.finalRating ?? 0);
  }

  for (const [deptId, ratings] of Object.entries(byDept)) {
    if (ratings.length < 2) continue;
    const deptAvg = ratings.reduce((s, r) => s + r, 0) / ratings.length;
    const diff = Math.abs(deptAvg - orgAvg);
    if (diff >= threshold) {
      const existing = await BiasFlag.findOne({ cycleId, type: 'GROUP_GAP', subjectId: deptId });
      if (!existing) {
        await BiasFlag.create({
          cycleId,
          type: 'GROUP_GAP',
          subjectId: deptId,
          metricName: 'avg_final_rating',
          metricValue: Math.round(deptAvg * 100) / 100,
          threshold,
          comparisonBaseline: Math.round(orgAvg * 100) / 100,
          status: 'OPEN',
        });
      }
    }
  }
}

// â”€â”€â”€ Token helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export { PerformanceCycle, Goal, RatingFormulaConfig, MeritMatrix, Appraisal, Feedback360Template, Feedback360Assignment, Feedback360Response, BiasFlag, AuditEvent };
