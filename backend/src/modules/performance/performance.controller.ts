import { Request, Response, NextFunction } from 'express';
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
} from './performance.model';
import {
  auditPerf,
  computeOkrAchievement,
  computeFinalRating,
  computePeerScore,
  runBiasDetection,
  generateToken,
  hashToken,
} from './performance.service';
import { feedback360EmailService } from './services/feedback360Email.service';
import { config } from '../../config';
import { AppError } from '../../middlewares/errorHandler';
import { Employee } from '../employees/employee.model';

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CYCLES
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
export const listCycles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cycles = await PerformanceCycle.find().sort({ startDate: -1 });
    res.json({ success: true, data: cycles });
  } catch (e) { next(e); }
};

export const getCycle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cycle = await PerformanceCycle.findById(req.params.id);
    if (!cycle) throw new AppError(404, 'Cycle not found');
    res.json({ success: true, data: cycle });
  } catch (e) { next(e); }
};

export const createCycle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cycle = await PerformanceCycle.create({ ...req.body, createdBy: req.user!.id });
    await auditPerf('PerformanceCycle', cycle._id.toString(), 'CREATE', req);
    res.status(201).json({ success: true, data: cycle });
  } catch (e) { next(e); }
};

export const updateCycle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cycle = await PerformanceCycle.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!cycle) throw new AppError(404, 'Cycle not found');
    await auditPerf('PerformanceCycle', cycle._id.toString(), 'UPDATE', req);
    res.json({ success: true, data: cycle });
  } catch (e) { next(e); }
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// GOALS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
export const listGoals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cycleId } = req.params;
    const { ownerType, ownerId } = req.query;
    const query: any = { cycleId };
    if (ownerType) query.ownerType = ownerType;
    if (ownerId) query.ownerId = ownerId;
    const goals = await Goal.find(query).sort({ createdAt: 1 });
    res.json({ success: true, data: goals });
  } catch (e) { next(e); }
};

export const createGoal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cycleId } = req.params;

    // Default ownerId to the requesting user if not provided
    const ownerId = req.body.ownerId || req.user!.id;

    // Weight validation: sum for same owner must not exceed 100
    if (req.body.weight !== undefined) {
      const existing = await Goal.find({
        cycleId,
        ownerType: req.body.ownerType,
        ownerId: new mongoose.Types.ObjectId(ownerId),
        isSuggested: { $ne: true },
      }).lean();
      const currentSum = existing.reduce((s: number, g: any) => s + (g.weight || 0), 0);
      if (currentSum + Number(req.body.weight) > 100) {
        throw new AppError(400, `Total goal weight would exceed 100% (current: ${currentSum}%, adding: ${req.body.weight}%)`);
      }
    }

    const goal = await Goal.create({
      ...req.body,
      cycleId,
      ownerId,
      isSuggested: req.body.isSuggested ?? false,
      suggestionStatus: req.body.suggestionStatus ?? 'ACCEPTED',
      createdBy: req.user!.id,
    });
    await auditPerf('Goal', goal._id.toString(), 'CREATE', req);
    res.status(201).json({ success: true, data: goal });
  } catch (e) { next(e); }
};

export const updateGoal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const goal = await Goal.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!goal) throw new AppError(404, 'Goal not found');
    await auditPerf('Goal', goal._id.toString(), 'UPDATE', req);
    res.json({ success: true, data: goal });
  } catch (e) { next(e); }
};

export const deleteGoal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const goal = await Goal.findByIdAndDelete(req.params.id);
    if (!goal) throw new AppError(404, 'Goal not found');
    await auditPerf('Goal', req.params.id, 'DELETE', req);
    res.json({ success: true, message: 'Goal deleted' });
  } catch (e) { next(e); }
};

export const updateGoalProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { progress, status } = req.body;
    if (progress === undefined) throw new AppError(400, 'progress is required');
    const update: any = { progress };
    if (status) update.status = status;
    const goal = await Goal.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!goal) throw new AppError(404, 'Goal not found');
    await auditPerf('Goal', goal._id.toString(), 'PROGRESS_UPDATE', req);
    res.json({ success: true, data: goal });
  } catch (e) { next(e); }
};

export const cascadeGoals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cycleId } = req.params;
    const teamGoals = await Goal.find({ cycleId, ownerType: 'TEAM' }).lean();
    if (!teamGoals.length) throw new AppError(400, 'No team goals found to cascade');
    const employees = await Employee.find({ status: 'active' }).select('_id managerId').lean();
    const created: any[] = [];
    for (const tg of teamGoals) {
      for (const emp of employees) {
        const existing = await Goal.findOne({ cycleId, parentGoalId: tg._id, ownerId: emp._id });
        if (!existing) {
          const suggested = await Goal.create({
            cycleId,
            title: `[Suggested] ${(tg as any).title}`,
            description: (tg as any).description,
            ownerType: 'INDIVIDUAL',
            ownerId: emp._id,
            weight: (tg as any).weight,
            progress: 0,
            status: 'ON_TRACK',
            parentGoalId: tg._id,
            isSuggested: true,
            suggestionStatus: 'PENDING',
            createdBy: req.user!.id,
          });
          created.push(suggested);
        }
      }
    }
    res.status(201).json({ success: true, data: created, message: `${created.length} suggested goals created` });
  } catch (e) { next(e); }
};

export const acceptSuggestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const goal = await Goal.findByIdAndUpdate(req.params.id, { suggestionStatus: 'ACCEPTED', isSuggested: false }, { new: true });
    if (!goal) throw new AppError(404, 'Goal not found');
    res.json({ success: true, data: goal });
  } catch (e) { next(e); }
};

export const rejectSuggestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const goal = await Goal.findByIdAndUpdate(req.params.id, { suggestionStatus: 'REJECTED' }, { new: true });
    if (!goal) throw new AppError(404, 'Goal not found');
    res.json({ success: true, data: goal });
  } catch (e) { next(e); }
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// RATING FORMULA
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
export const getRatingFormula = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const formula = await RatingFormulaConfig.findOne({ cycleId: req.params.cycleId }).sort({ versionNumber: -1 });
    res.json({ success: true, data: formula });
  } catch (e) { next(e); }
};

export const upsertRatingFormula = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cycleId } = req.params;
    const { managerWeight, okrWeight, peerWeight } = req.body;
    const total = (managerWeight || 0) + (okrWeight || 0) + (peerWeight || 0);
    if (Math.abs(total - 1) > 0.01) throw new AppError(400, 'Weights must sum to 1.0');
    const latest = await RatingFormulaConfig.findOne({ cycleId }).sort({ versionNumber: -1 }).lean();
    const versionNumber = ((latest?.versionNumber) ?? 0) + 1;
    const formula = await RatingFormulaConfig.create({
      cycleId,
      managerWeight,
      okrWeight,
      peerWeight,
      scale: req.body.scale || 5,
      okrMapping: { type: 'LINEAR', minPct: 0, maxPct: 100 },
      versionNumber,
    });
    await auditPerf('RatingFormulaConfig', formula._id.toString(), 'UPSERT', req);
    res.json({ success: true, data: formula });
  } catch (e) { next(e); }
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// MERIT MATRIX
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
export const getMeritMatrix = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const matrix = await MeritMatrix.findOne({ cycleId: req.params.cycleId });
    res.json({ success: true, data: matrix });
  } catch (e) { next(e); }
};

export const upsertMeritMatrix = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cycleId } = req.params;
    const matrix = await MeritMatrix.findOneAndUpdate(
      { cycleId },
      { ...req.body, cycleId },
      { upsert: true, new: true, runValidators: true }
    );
    await auditPerf('MeritMatrix', matrix._id.toString(), 'UPSERT', req);
    res.json({ success: true, data: matrix });
  } catch (e) { next(e); }
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// APPRAISALS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
export const generateAppraisals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cycleId } = req.params;
    const cycle = await PerformanceCycle.findById(cycleId);
    if (!cycle) throw new AppError(404, 'Cycle not found');
    const employees = await Employee.find({ status: 'active' }).lean();
    const created: any[] = [];
    for (const emp of employees) {
      const existing = await Appraisal.findOne({ cycleId, employeeId: emp._id });
      if (!existing) {
        const okrPct = await computeOkrAchievement(cycleId, emp._id.toString());
        const a = await Appraisal.create({
          cycleId,
          employeeId: emp._id,
          managerId: (emp as any).managerId,
          status: 'DRAFT',
          okrAchievementPct: okrPct,
          approvals: [
            { stepName: 'Manager', status: 'PENDING' },
            { stepName: 'HRBP', status: 'PENDING' },
            { stepName: 'Comp Committee', status: 'PENDING' },
            { stepName: 'Finance', status: 'PENDING' },
          ],
        });
        created.push(a);
      }
    }
    res.status(201).json({ success: true, data: created, message: `${created.length} appraisals created` });
  } catch (e) { next(e); }
};

export const listAppraisals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cycleId } = req.params;
    const roles = req.user!.roles;
    const query: any = { cycleId };
    // Employees can only see their own
    if (!roles.some((r) => ['ADMIN', 'HR_ADMIN', 'HRBP', 'MANAGER'].includes(r))) {
      throw new AppError(403, 'Insufficient permissions');
    }
    const appraisals = await Appraisal.find(query)
      .populate('employeeId', 'firstName lastName employeeCode jobTitle departmentId')
      .populate('managerId', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: appraisals });
  } catch (e) { next(e); }
};

export const getAppraisal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appraisal = await Appraisal.findById(req.params.id)
      .populate('employeeId', 'firstName lastName employeeCode jobTitle')
      .populate('managerId', 'firstName lastName');
    if (!appraisal) throw new AppError(404, 'Appraisal not found');
    // RBAC: employee can only see own
    const roles = req.user!.roles;
    if (!roles.some((r) => ['ADMIN', 'HR_ADMIN', 'HRBP', 'MANAGER'].includes(r))) {
      throw new AppError(403, 'Insufficient permissions');
    }
    res.json({ success: true, data: appraisal });
  } catch (e) { next(e); }
};

export const updateAppraisal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appraisal = await Appraisal.findById(req.params.id);
    if (!appraisal) throw new AppError(404, 'Appraisal not found');
    const allowed = ['managerScore', 'selfAssessmentText', 'managerAssessmentText', 'okrAchievementPct', 'peerFeedbackScore'];
    const update: any = {};
    for (const k of allowed) { if (req.body[k] !== undefined) update[k] = req.body[k]; }
    Object.assign(appraisal, update);
    const { finalRating, version } = await computeFinalRating(appraisal);
    appraisal.finalRating = finalRating;
    appraisal.formulaVersionNumber = version;
    await appraisal.save();
    await auditPerf('Appraisal', appraisal._id.toString(), 'UPDATE', req);
    res.json({ success: true, data: appraisal });
  } catch (e) { next(e); }
};

export const submitByManager = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appraisal = await Appraisal.findById(req.params.id);
    if (!appraisal) throw new AppError(404, 'Appraisal not found');
    const { finalRating, version } = await computeFinalRating(appraisal);
    appraisal.finalRating = finalRating;
    appraisal.formulaVersionNumber = version;
    appraisal.status = 'SUBMITTED_BY_MANAGER';
    await appraisal.save();
    await auditPerf('Appraisal', appraisal._id.toString(), 'SUBMIT_MANAGER', req);
    res.json({ success: true, data: appraisal });
  } catch (e) { next(e); }
};

export const submitByEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appraisal = await Appraisal.findById(req.params.id);
    if (!appraisal) throw new AppError(404, 'Appraisal not found');
    if (req.body.selfAssessmentText) appraisal.selfAssessmentText = req.body.selfAssessmentText;
    appraisal.status = 'SUBMITTED_BY_EMPLOYEE';
    await appraisal.save();
    await auditPerf('Appraisal', appraisal._id.toString(), 'SUBMIT_EMPLOYEE', req);
    res.json({ success: true, data: appraisal });
  } catch (e) { next(e); }
};

export const approveAppraisal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appraisal = await Appraisal.findById(req.params.id);
    if (!appraisal) throw new AppError(404, 'Appraisal not found');
    const step = appraisal.approvals.find((a: any) => a.status === 'PENDING');
    if (!step) throw new AppError(400, 'No pending approval step');
    step.status = 'APPROVED';
    step.actorId = new mongoose.Types.ObjectId(req.user!.id);
    step.actedAt = new Date();
    step.note = req.body.note;
    const allApproved = appraisal.approvals.every((a: any) => a.status === 'APPROVED');
    if (allApproved) appraisal.status = 'APPROVED';
    else appraisal.status = 'CALIBRATED';
    await appraisal.save();
    await auditPerf('Appraisal', appraisal._id.toString(), 'APPROVE_STEP', req);
    res.json({ success: true, data: appraisal });
  } catch (e) { next(e); }
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// 360 TEMPLATES
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
export const list360Templates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cycleId } = req.params;
    const templates = await Feedback360Template.find({ $or: [{ cycleId }, { reusable: true }] });
    res.json({ success: true, data: templates });
  } catch (e) { next(e); }
};

export const get360Template = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const t = await Feedback360Template.findById(req.params.id);
    if (!t) throw new AppError(404, 'Template not found');
    res.json({ success: true, data: t });
  } catch (e) { next(e); }
};

export const create360Template = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cycleId } = req.params;
    // Validate sections and questions
    if (!req.body.sections || !Array.isArray(req.body.sections) || req.body.sections.length === 0) {
      throw new AppError(400, 'At least one section is required');
    }
    for (const section of req.body.sections) {
      if (!section.questions || !Array.isArray(section.questions) || section.questions.length === 0) {
        throw new AppError(400, 'Each section must have at least one question');
      }
      for (const q of section.questions) {
        if (q.type === 'LIKERT' && q.scaleMin >= q.scaleMax) {
          throw new AppError(400, 'LIKERT questions must have scaleMin < scaleMax');
        }
      }
    }
    const t = await Feedback360Template.create({ 
      ...req.body, 
      cycleId: cycleId || null,
      createdBy: req.user!.id 
    });
    await auditPerf('Feedback360Template', t._id.toString(), 'CREATE', req);
    res.status(201).json({ success: true, data: t });
  } catch (e) { next(e); }
};

export const update360Template = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate sections and questions if provided
    if (req.body.sections) {
      if (!Array.isArray(req.body.sections) || req.body.sections.length === 0) {
        throw new AppError(400, 'At least one section is required');
      }
      for (const section of req.body.sections) {
        if (!section.questions || !Array.isArray(section.questions) || section.questions.length === 0) {
          throw new AppError(400, 'Each section must have at least one question');
        }
        for (const q of section.questions) {
          if (q.type === 'LIKERT' && q.scaleMin >= q.scaleMax) {
            throw new AppError(400, 'LIKERT questions must have scaleMin < scaleMax');
          }
        }
      }
    }
    const t = await Feedback360Template.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!t) throw new AppError(404, 'Template not found');
    await auditPerf('Feedback360Template', t._id.toString(), 'UPDATE', req);
    res.json({ success: true, data: t });
  } catch (e) { next(e); }
};

export const delete360Template = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const t = await Feedback360Template.findByIdAndDelete(req.params.id);
    if (!t) throw new AppError(404, 'Template not found');
    await auditPerf('Feedback360Template', req.params.id, 'DELETE', req);
    res.json({ success: true, message: 'Template deleted' });
  } catch (e) { next(e); }
};

export const duplicate360Template = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const original = await Feedback360Template.findById(req.params.id);
    if (!original) throw new AppError(404, 'Template not found');
    const duplicated = await Feedback360Template.create({
      name: `${original.name} (Copy)`,
      cycleId: original.cycleId,
      reusable: original.reusable,
      sections: original.sections,
      settings: original.settings,
      createdBy: req.user!.id,
    });
    await auditPerf('Feedback360Template', duplicated._id.toString(), 'DUPLICATE', req);
    res.status(201).json({ success: true, data: duplicated });
  } catch (e) { next(e); }
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// 360 ASSIGNMENTS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
export const generate360Assignments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cycleId } = req.params;
    const { templateId, targetEmployeeIds, ratersConfig, requiredResponsesCount, deadlineAt } = req.body;
    if (!templateId) throw new AppError(400, 'templateId is required');
    
    const template = await Feedback360Template.findById(templateId);
    if (!template) throw new AppError(404, 'Template not found');
    
    const targetEmployees = targetEmployeeIds && targetEmployeeIds.length > 0
      ? await Employee.find({ _id: { $in: targetEmployeeIds }, status: 'active' }).lean()
      : await Employee.find({ status: 'active' }).lean();
    
    const created: any[] = [];
    const frontendUrl = config.cors.frontendUrl || 'http://localhost:3000';
    
    for (const emp of targetEmployees) {
      const existing = await Feedback360Assignment.findOne({ cycleId, targetEmployeeId: emp._id });
      if (existing) continue; // Skip if already exists
      
      const raters: any[] = [];
      const empData = emp as any;
      
      // Auto-add manager if available
      if (ratersConfig?.includeManager !== false && empData.managerId) {
        const manager = await Employee.findById(empData.managerId).lean();
        if (manager) {
          const token = generateToken();
          raters.push({
            id: crypto.randomBytes(16).toString('hex'),
            raterEmployeeId: manager._id,
            name: `${(manager as any).firstName} ${(manager as any).lastName}`,
            email: (manager as any).email,
            roleType: 'MANAGER',
            tokenHash: hashToken(token),
            status: 'SENT',
          });
        }
      }
      
      // Auto-add self if requested
      if (ratersConfig?.includeSelf !== false) {
        const selfToken = generateToken();
        raters.push({
          id: crypto.randomBytes(16).toString('hex'),
          raterEmployeeId: emp._id,
          name: `${empData.firstName} ${empData.lastName}`,
          email: empData.email,
          roleType: 'SELF',
          tokenHash: hashToken(selfToken),
          status: 'SENT',
        });
      }
      
      // Add custom raters from config
      if (ratersConfig?.customRaters && Array.isArray(ratersConfig.customRaters)) {
        for (const customRater of ratersConfig.customRaters) {
          if (customRater.targetEmployeeId?.toString() === emp._id.toString()) {
            const token = generateToken();
            raters.push({
              id: crypto.randomBytes(16).toString('hex'),
              raterEmployeeId: customRater.employeeId || null,
              name: customRater.name,
              email: customRater.email,
              roleType: customRater.roleType || 'PEER',
              tokenHash: hashToken(token),
              status: 'SENT',
            });
          }
        }
      }
      
      // Auto-add direct reports if requested
      if (ratersConfig?.includeDirectReports) {
        const directReports = await Employee.find({ managerId: emp._id, status: 'active' }).lean();
        for (const dr of directReports) {
          const token = generateToken();
          raters.push({
            id: crypto.randomBytes(16).toString('hex'),
            raterEmployeeId: dr._id,
            name: `${(dr as any).firstName} ${(dr as any).lastName}`,
            email: (dr as any).email,
            roleType: 'DIRECT_REPORT',
            tokenHash: hashToken(token),
            status: 'SENT',
          });
        }
      }
      
      if (raters.length === 0) {
        throw new AppError(400, `No raters configured for employee ${empData.firstName} ${empData.lastName}`);
      }
      
      const assignment = await Feedback360Assignment.create({
        cycleId,
        templateId,
        targetEmployeeId: emp._id,
        requiredResponsesCount: requiredResponsesCount || raters.length,
        deadlineAt: deadlineAt || null,
        status: 'NOT_STARTED',
        collectedResponsesCount: 0,
        raters,
        createdBy: req.user!.id,
      });
      
      created.push(assignment);
    }
    
    await auditPerf('Feedback360Assignment', 'BATCH', 'GENERATE', req);
    res.status(201).json({ success: true, data: created, message: `${created.length} assignments created` });
  } catch (e) { next(e); }
};

export const list360Assignments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cycleId } = req.params;
    const assignments = await Feedback360Assignment.find({ cycleId })
      .populate('targetEmployeeId', 'firstName lastName employeeCode')
      .populate('templateId', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: assignments });
  } catch (e) { next(e); }
};

export const get360Assignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const a = await Feedback360Assignment.findById(req.params.id)
      .populate('targetEmployeeId', 'firstName lastName employeeCode')
      .populate('templateId', 'name sections settings');
    if (!a) throw new AppError(404, 'Assignment not found');
    res.json({ success: true, data: a });
  } catch (e) { next(e); }
};

export const update360Assignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const a = await Feedback360Assignment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!a) throw new AppError(404, 'Assignment not found');
    res.json({ success: true, data: a });
  } catch (e) { next(e); }
};

export const send360Invites = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assignment = await Feedback360Assignment.findById(req.params.id)
      .populate('targetEmployeeId', 'firstName lastName');
    if (!assignment) throw new AppError(404, 'Assignment not found');
    
    if (assignment.status === 'LOCKED' || assignment.status === 'COMPLETED') {
      throw new AppError(400, 'Cannot send invites for locked or completed assignments');
    }
    
    const targetEmp = assignment.targetEmployeeId as any;
    const targetName = `${targetEmp.firstName} ${targetEmp.lastName}`;
    const frontendUrl = config.cors.frontendUrl || 'http://localhost:3000';
    let sentCount = 0;
    
    // Generate new tokens for raters who haven't submitted
    // Note: This regenerates tokens, so any previously sent links will no longer work
    // In production, consider storing raw tokens securely or using a token service
    for (let i = 0; i < assignment.raters.length; i++) {
      const rater = assignment.raters[i];
      if (rater.status === 'SUBMITTED') continue; // Skip already submitted
      
      // Generate new token and update hash
      const token = generateToken();
      const tokenHash = hashToken(token);
      
      // Update rater token hash and status
      rater.tokenHash = tokenHash;
      if (rater.status !== 'SENT') {
        rater.status = 'SENT';
      }
      
      const responseLink = `${frontendUrl}/performance/360/respond/${token}`;
      
      try {
        await feedback360EmailService.send360InviteEmail({
          name: rater.name,
          email: rater.email,
          reviewedEmployeeName: targetName,
          link: responseLink,
          deadlineAt: assignment.deadlineAt || null,
          roleType: rater.roleType,
        });
        sentCount++;
      } catch (emailError) {
        console.error(`Failed to send email to ${rater.email}:`, emailError);
        // Continue with other raters
      }
    }
    
    if (assignment.status === 'NOT_STARTED') {
      assignment.status = 'SENT';
    }
    await assignment.save();
    await auditPerf('Feedback360Assignment', assignment._id.toString(), 'SEND_INVITES', req);
    
    res.json({ 
      success: true, 
      data: assignment, 
      message: `Invitations sent to ${sentCount} rater(s)` 
    });
  } catch (e) { next(e); }
};

export const get360FormByToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tokenHash = hashToken(req.params.token);
    const assignment = await Feedback360Assignment.findOne({ 'raters.tokenHash': tokenHash })
      .populate('templateId');
    if (!assignment) throw new AppError(404, 'Invalid or expired token');
    const rater = assignment.raters.find((r: any) => r.tokenHash === tokenHash);
    res.json({ success: true, data: { assignment, rater, template: (assignment as any).templateId } });
  } catch (e) { next(e); }
};

export const mark360Opened = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tokenHash = hashToken(req.params.token);
    const assignment = await Feedback360Assignment.findOne({ 'raters.tokenHash': tokenHash });
    if (!assignment) throw new AppError(404, 'Invalid token');
    const rater = assignment.raters.find((r: any) => r.tokenHash === tokenHash);
    if (rater && rater.status === 'SENT') { rater.status = 'OPENED'; rater.openedAt = new Date(); }
    if (assignment.status === 'SENT') assignment.status = 'IN_PROGRESS';
    await assignment.save();
    res.json({ success: true });
  } catch (e) { next(e); }
};

export const submit360Response = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tokenHash = hashToken(req.params.token);
    const assignment = await Feedback360Assignment.findOne({ 'raters.tokenHash': tokenHash });
    if (!assignment) throw new AppError(404, 'Invalid token');
    const rater = assignment.raters.find((r: any) => r.tokenHash === tokenHash);
    if (!rater) throw new AppError(404, 'Rater not found');
    if (rater.status === 'SUBMITTED') throw new AppError(400, 'Already submitted');

    const existing = await Feedback360Response.findOne({ assignmentId: assignment._id, raterTokenHash: tokenHash });
    const answers = req.body.answers || [];
    if (existing) {
      existing.answers = answers;
      existing.status = 'SUBMITTED';
      existing.submittedAt = new Date();
      await existing.save();
    } else {
      await Feedback360Response.create({
        assignmentId: assignment._id,
        raterTokenHash: tokenHash,
        answers,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    rater.status = 'SUBMITTED';
    rater.submittedAt = new Date();
    assignment.collectedResponsesCount = assignment.raters.filter((r: any) => r.status === 'SUBMITTED').length;
    if (assignment.collectedResponsesCount >= assignment.requiredResponsesCount) assignment.status = 'COMPLETED';
    await assignment.save();
    res.json({ success: true, message: 'Response submitted' });
  } catch (e) { next(e); }
};

export const get360Aggregate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assignment = await Feedback360Assignment.findById(req.params.id)
      .populate('templateId')
      .populate('targetEmployeeId', 'firstName lastName');
    if (!assignment) throw new AppError(404, 'Assignment not found');
    
    const template = assignment.templateId as any;
    const settings = template?.settings || { anonymous: true, minResponsesToShow: 3 };
    
    if (assignment.collectedResponsesCount < settings.minResponsesToShow) {
      return res.json({ 
        success: true, 
        data: { 
          tooFewResponses: true, 
          collected: assignment.collectedResponsesCount,
          required: settings.minResponsesToShow 
        } 
      });
    }
    
    const responses = await Feedback360Response.find({ 
      assignmentId: assignment._id, 
      status: 'SUBMITTED' 
    }).lean();
    
    // Compute section and question aggregates
    const sectionAggregates: any[] = [];
    const allLikertScores: number[] = [];
    
    for (const section of template.sections || []) {
      const questionAggregates: any[] = [];
      
      for (const question of section.questions || []) {
        if (question.type === 'LIKERT') {
          const values: number[] = [];
          responses.forEach((r: any) => {
            const answer = r.answers.find((a: any) => a.questionId === question.id);
            if (answer && typeof answer.value === 'number') {
              values.push(answer.value);
              allLikertScores.push(answer.value);
            }
          });
          
          if (values.length > 0) {
            const avg = values.reduce((s, v) => s + v, 0) / values.length;
            const min = Math.min(...values);
            const max = Math.max(...values);
            questionAggregates.push({
              questionId: question.id,
              prompt: question.prompt,
              type: 'LIKERT',
              average: Math.round(avg * 100) / 100,
              min,
              max,
              count: values.length,
              distribution: values.reduce((acc: any, v) => {
                acc[v] = (acc[v] || 0) + 1;
                return acc;
              }, {}),
            });
          }
        } else if (question.type === 'TEXT') {
          const comments: any[] = [];
          responses.forEach((r: any) => {
            const answer = r.answers.find((a: any) => a.questionId === question.id);
            if (answer && answer.value) {
              comments.push({
                text: answer.value,
                raterName: settings.anonymous ? null : (r.raterEmployeeId ? 'Employee' : 'External'),
                submittedAt: r.submittedAt,
              });
            }
          });
          
          questionAggregates.push({
            questionId: question.id,
            prompt: question.prompt,
            type: 'TEXT',
            comments: settings.anonymous ? comments.map(c => ({ text: c.text, submittedAt: c.submittedAt })) : comments,
            count: comments.length,
          });
        }
      }
      
      sectionAggregates.push({
        sectionId: section.id,
        title: section.title,
        questions: questionAggregates,
      });
    }
    
    // Compute overall peer score (average of all LIKERT responses, normalized to 0-5)
    const overallPeerScore = allLikertScores.length > 0
      ? Math.round((allLikertScores.reduce((s, v) => s + v, 0) / allLikertScores.length) * 100) / 100
      : 0;
    
    res.json({ 
      success: true, 
      data: { 
        assignment: {
          _id: assignment._id,
          targetEmployee: assignment.targetEmployeeId,
          collectedResponsesCount: assignment.collectedResponsesCount,
          requiredResponsesCount: assignment.requiredResponsesCount,
          status: assignment.status,
        },
        responseCount: responses.length,
        overallPeerScore,
        sectionAggregates,
        settings: {
          anonymous: settings.anonymous,
          minResponsesToShow: settings.minResponsesToShow,
        },
      } 
    });
  } catch (e) { next(e); }
};

export const sync360ToAppraisals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cycleId } = req.params;
    const assignments = await Feedback360Assignment.find({ cycleId }).lean();
    let updated = 0;
    for (const assign of assignments) {
      const peerScore = await computePeerScore(assign._id.toString());
      const appraisal = await Appraisal.findOne({ cycleId, employeeId: assign.targetEmployeeId });
      if (appraisal) {
        appraisal.peerFeedbackScore = peerScore;
        const { finalRating, version } = await computeFinalRating(appraisal);
        appraisal.finalRating = finalRating;
        appraisal.formulaVersionNumber = version;
        await appraisal.save();
        updated++;
      }
    }
    res.json({ success: true, message: `Synced ${updated} appraisals` });
  } catch (e) { next(e); }
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// BIAS DETECTION
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
export const getBiasSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cycleId } = req.params;
    const flags = await BiasFlag.find({ cycleId }).lean();
    const summary = {
      total: flags.length,
      open: flags.filter((f: any) => f.status === 'OPEN').length,
      reviewed: flags.filter((f: any) => f.status === 'REVIEWED').length,
      dismissed: flags.filter((f: any) => f.status === 'DISMISSED').length,
      actioned: flags.filter((f: any) => f.status === 'ACTIONED').length,
      byType: {
        MANAGER_OUTLIER: flags.filter((f: any) => f.type === 'MANAGER_OUTLIER').length,
        GROUP_GAP: flags.filter((f: any) => f.type === 'GROUP_GAP').length,
        DISTRIBUTION_ANOMALY: flags.filter((f: any) => f.type === 'DISTRIBUTION_ANOMALY').length,
      },
    };
    res.json({ success: true, data: { summary, flags } });
  } catch (e) { next(e); }
};

export const getBiasFlags = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const flags = await BiasFlag.find({ cycleId: req.params.cycleId }).sort({ createdAt: -1 });
    res.json({ success: true, data: flags });
  } catch (e) { next(e); }
};

export const runBias = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cycleId } = req.params;
    const threshold = req.body.threshold ?? 0.8;
    await runBiasDetection(cycleId, threshold);
    const flags = await BiasFlag.find({ cycleId, status: 'OPEN' });
    await auditPerf('BiasDetection', cycleId, 'RUN', req);
    res.json({ success: true, data: flags, message: `Bias detection complete. ${flags.length} open flags.` });
  } catch (e) { next(e); }
};

export const updateBiasFlag = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const flag = await BiasFlag.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!flag) throw new AppError(404, 'Flag not found');
    await auditPerf('BiasFlag', flag._id.toString(), 'UPDATE', req);
    res.json({ success: true, data: flag });
  } catch (e) { next(e); }
};
