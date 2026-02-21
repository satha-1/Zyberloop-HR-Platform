import { Request, Response, NextFunction } from 'express';
import { WorkforceScenario } from './workforce.model';
import { AppError } from '../../middlewares/errorHandler';
import { createAuditLog } from '../logs/log.service';

export const getScenarios = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scenarioType, status, departmentId } = req.query;
    const query: any = {};
    if (scenarioType) query.scenarioType = scenarioType;
    if (status) query.status = status;
    if (departmentId) query.departmentId = departmentId;
    const scenarios = await WorkforceScenario.find(query)
      .populate('departmentId', 'name code')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: scenarios });
  } catch (error) {
    next(error);
  }
};

export const createScenario = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scenario = new WorkforceScenario({
      ...req.body,
      createdBy: req.user!.id,
    });
    await scenario.save();
    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'CREATE',
      module: 'Workforce',
      resourceType: 'scenario',
      resourceId: scenario._id.toString(),
      ipAddress: req.ip || 'unknown',
    });
    res.status(201).json({ success: true, data: scenario });
  } catch (error) {
    next(error);
  }
};

export const updateScenario = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const scenario = await WorkforceScenario.findByIdAndUpdate(id, req.body, { new: true });
    if (!scenario) throw new AppError(404, 'Scenario not found');
    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'UPDATE',
      module: 'Workforce',
      resourceType: 'scenario',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
    });
    res.json({ success: true, data: scenario });
  } catch (error) {
    next(error);
  }
};

export const deleteScenario = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await WorkforceScenario.findByIdAndDelete(id);
    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'DELETE',
      module: 'Workforce',
      resourceType: 'scenario',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
    });
    res.json({ success: true, message: 'Scenario deleted' });
  } catch (error) {
    next(error);
  }
};
