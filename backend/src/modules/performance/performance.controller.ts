import { Request, Response, NextFunction } from 'express';
import { PerformanceCycle, Goal, Appraisal } from './performance.model';
import { AppError } from '../../middlewares/errorHandler';
import { createAuditLog } from '../logs/log.service';

// Performance Cycles
export const getPerformanceCycles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cycles = await PerformanceCycle.find().sort({ startDate: -1 });
    res.json({ success: true, data: cycles });
  } catch (error) {
    next(error);
  }
};

export const createPerformanceCycle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cycle = new PerformanceCycle(req.body);
    await cycle.save();
    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'CREATE',
      module: 'Performance',
      resourceType: 'performance_cycle',
      resourceId: cycle._id.toString(),
      ipAddress: req.ip || 'unknown',
    });
    res.status(201).json({ success: true, data: cycle });
  } catch (error) {
    next(error);
  }
};

// Goals
export const getGoals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employeeId, cycleId } = req.query;
    const query: any = {};
    if (employeeId) query.employeeId = employeeId;
    if (cycleId) query.cycleId = cycleId;
    const goals = await Goal.find(query)
      .populate('employeeId', 'firstName lastName employeeCode')
      .populate('cycleId', 'name');
    res.json({ success: true, data: goals });
  } catch (error) {
    next(error);
  }
};

export const createGoal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const goal = new Goal(req.body);
    await goal.save();
    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'CREATE',
      module: 'Performance',
      resourceType: 'goal',
      resourceId: goal._id.toString(),
      ipAddress: req.ip || 'unknown',
    });
    res.status(201).json({ success: true, data: goal });
  } catch (error) {
    next(error);
  }
};

export const updateGoal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const goal = await Goal.findByIdAndUpdate(id, req.body, { new: true });
    if (!goal) throw new AppError(404, 'Goal not found');
    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'UPDATE',
      module: 'Performance',
      resourceType: 'goal',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
    });
    res.json({ success: true, data: goal });
  } catch (error) {
    next(error);
  }
};

// Appraisals
export const getAppraisals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employeeId, cycleId } = req.query;
    const query: any = {};
    if (employeeId) query.employeeId = employeeId;
    if (cycleId) query.cycleId = cycleId;
    const appraisals = await Appraisal.find(query)
      .populate('employeeId', 'firstName lastName employeeCode')
      .populate('cycleId', 'name');
    res.json({ success: true, data: appraisals });
  } catch (error) {
    next(error);
  }
};

export const createAppraisal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { managerScore, okrAchievement, peerFeedbackScore } = req.body;
    const finalRating = (managerScore * 0.5) + (okrAchievement * 0.3) + (peerFeedbackScore * 0.2);
    const appraisal = new Appraisal({ ...req.body, finalRating });
    await appraisal.save();
    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'CREATE',
      module: 'Performance',
      resourceType: 'appraisal',
      resourceId: appraisal._id.toString(),
      ipAddress: req.ip || 'unknown',
    });
    res.status(201).json({ success: true, data: appraisal });
  } catch (error) {
    next(error);
  }
};

export const updateAppraisal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (updateData.managerScore || updateData.okrAchievement || updateData.peerFeedbackScore) {
      updateData.finalRating = 
        (updateData.managerScore || 0) * 0.5 +
        (updateData.okrAchievement || 0) * 0.3 +
        (updateData.peerFeedbackScore || 0) * 0.2;
    }
    const appraisal = await Appraisal.findByIdAndUpdate(id, updateData, { new: true });
    if (!appraisal) throw new AppError(404, 'Appraisal not found');
    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'UPDATE',
      module: 'Performance',
      resourceType: 'appraisal',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
    });
    res.json({ success: true, data: appraisal });
  } catch (error) {
    next(error);
  }
};
