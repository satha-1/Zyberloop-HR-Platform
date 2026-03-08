import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import {
  WorkforcePlanningScenario,
  WorkforcePlanningInput,
} from './workforcePlanning.model';
import {
  calculateScenarioImpact,
  activateScenario,
  activatePlanningInput,
} from './workforcePlanning.service';
import { AppError } from '../../middlewares/errorHandler';
import { createAuditLog } from '../logs/log.service';

// ────────────────────────────────────────────────────────────────────────────────
// SCENARIOS
// ────────────────────────────────────────────────────────────────────────────────

export const getScenarios = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, status } = req.query;
    const query: any = {};

    if (search && typeof search === 'string') {
      query.name = { $regex: search, $options: 'i' };
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const scenarios = await WorkforcePlanningScenario.find(query)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: scenarios });
  } catch (e) {
    next(e);
  }
};

export const getScenario = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scenario = await WorkforcePlanningScenario.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!scenario) {
      throw new AppError(404, 'Scenario not found');
    }

    res.json({ success: true, data: scenario });
  } catch (e) {
    next(e);
  }
};

export const createScenario = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scenario = await WorkforcePlanningScenario.create({
      ...req.body,
      status: req.body.status || 'DRAFT',
      createdBy: req.user!.id,
    });

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'CREATE',
      module: 'WorkforcePlanning',
      resourceType: 'scenario',
      resourceId: scenario._id.toString(),
      ipAddress: req.ip || 'unknown',
    });

    res.status(201).json({ success: true, data: scenario });
  } catch (e) {
    next(e);
  }
};

export const updateScenario = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scenario = await WorkforcePlanningScenario.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user!.id,
      },
      { new: true, runValidators: true }
    );

    if (!scenario) {
      throw new AppError(404, 'Scenario not found');
    }

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'UPDATE',
      module: 'WorkforcePlanning',
      resourceType: 'scenario',
      resourceId: scenario._id.toString(),
      ipAddress: req.ip || 'unknown',
    });

    res.json({ success: true, data: scenario });
  } catch (e) {
    next(e);
  }
};

export const deleteScenario = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scenario = await WorkforcePlanningScenario.findById(req.params.id);
    if (!scenario) {
      throw new AppError(404, 'Scenario not found');
    }

    if (scenario.status === 'ACTIVE') {
      throw new AppError(400, 'Cannot delete an active scenario. Freeze or archive it first.');
    }

    await WorkforcePlanningScenario.findByIdAndDelete(req.params.id);

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'DELETE',
      module: 'WorkforcePlanning',
      resourceType: 'scenario',
      resourceId: req.params.id,
      ipAddress: req.ip || 'unknown',
    });

    res.json({ success: true, message: 'Scenario deleted' });
  } catch (e) {
    next(e);
  }
};

export const activateScenarioStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await activateScenario(req.params.id);

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'ACTIVATE',
      module: 'WorkforcePlanning',
      resourceType: 'scenario',
      resourceId: req.params.id,
      ipAddress: req.ip || 'unknown',
    });

    const scenario = await WorkforcePlanningScenario.findById(req.params.id);
    res.json({ success: true, data: scenario, message: 'Scenario activated' });
  } catch (e) {
    next(e);
  }
};

export const freezeScenario = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scenario = await WorkforcePlanningScenario.findByIdAndUpdate(
      req.params.id,
      { status: 'FROZEN', updatedBy: req.user!.id },
      { new: true }
    );

    if (!scenario) {
      throw new AppError(404, 'Scenario not found');
    }

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'FREEZE',
      module: 'WorkforcePlanning',
      resourceType: 'scenario',
      resourceId: req.params.id,
      ipAddress: req.ip || 'unknown',
    });

    res.json({ success: true, data: scenario, message: 'Scenario frozen' });
  } catch (e) {
    next(e);
  }
};

export const archiveScenario = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scenario = await WorkforcePlanningScenario.findByIdAndUpdate(
      req.params.id,
      { status: 'ARCHIVED', updatedBy: req.user!.id },
      { new: true }
    );

    if (!scenario) {
      throw new AppError(404, 'Scenario not found');
    }

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'ARCHIVE',
      module: 'WorkforcePlanning',
      resourceType: 'scenario',
      resourceId: req.params.id,
      ipAddress: req.ip || 'unknown',
    });

    res.json({ success: true, data: scenario, message: 'Scenario archived' });
  } catch (e) {
    next(e);
  }
};

export const getScenarioImpact = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const impact = await calculateScenarioImpact(req.params.id);
    res.json({ success: true, data: impact });
  } catch (e) {
    next(e);
  }
};

// ────────────────────────────────────────────────────────────────────────────────
// PLANNING INPUTS
// ────────────────────────────────────────────────────────────────────────────────

export const getPlanningInputs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inputs = await WorkforcePlanningInput.find()
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: inputs });
  } catch (e) {
    next(e);
  }
};

export const getActivePlanningInput = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = await WorkforcePlanningInput.findOne({ isActive: true })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    res.json({ success: true, data: input });
  } catch (e) {
    next(e);
  }
};

export const getPlanningInput = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = await WorkforcePlanningInput.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!input) {
      throw new AppError(404, 'Planning input not found');
    }

    res.json({ success: true, data: input });
  } catch (e) {
    next(e);
  }
};

export const createPlanningInput = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate min <= max
    if (req.body.hiringVelocityMinPerMonth > req.body.hiringVelocityMaxPerMonth) {
      throw new AppError(400, 'hiringVelocityMinPerMonth must be <= hiringVelocityMaxPerMonth');
    }

    const input = await WorkforcePlanningInput.create({
      ...req.body,
      createdBy: req.user!.id,
    });

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'CREATE',
      module: 'WorkforcePlanning',
      resourceType: 'planningInput',
      resourceId: input._id.toString(),
      ipAddress: req.ip || 'unknown',
    });

    res.status(201).json({ success: true, data: input });
  } catch (e) {
    next(e);
  }
};

export const updatePlanningInput = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate min <= max if both are provided
    if (
      req.body.hiringVelocityMinPerMonth !== undefined &&
      req.body.hiringVelocityMaxPerMonth !== undefined &&
      req.body.hiringVelocityMinPerMonth > req.body.hiringVelocityMaxPerMonth
    ) {
      throw new AppError(400, 'hiringVelocityMinPerMonth must be <= hiringVelocityMaxPerMonth');
    }

    const input = await WorkforcePlanningInput.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user!.id,
      },
      { new: true, runValidators: true }
    );

    if (!input) {
      throw new AppError(404, 'Planning input not found');
    }

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'UPDATE',
      module: 'WorkforcePlanning',
      resourceType: 'planningInput',
      resourceId: input._id.toString(),
      ipAddress: req.ip || 'unknown',
    });

    res.json({ success: true, data: input });
  } catch (e) {
    next(e);
  }
};

export const deletePlanningInput = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = await WorkforcePlanningInput.findById(req.params.id);
    if (!input) {
      throw new AppError(404, 'Planning input not found');
    }

    if (input.isActive) {
      throw new AppError(400, 'Cannot delete active planning input. Activate another one first.');
    }

    await WorkforcePlanningInput.findByIdAndDelete(req.params.id);

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'DELETE',
      module: 'WorkforcePlanning',
      resourceType: 'planningInput',
      resourceId: req.params.id,
      ipAddress: req.ip || 'unknown',
    });

    res.json({ success: true, message: 'Planning input deleted' });
  } catch (e) {
    next(e);
  }
};

export const activatePlanningInputStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await activatePlanningInput(req.params.id);

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'ACTIVATE',
      module: 'WorkforcePlanning',
      resourceType: 'planningInput',
      resourceId: req.params.id,
      ipAddress: req.ip || 'unknown',
    });

    const input = await WorkforcePlanningInput.findById(req.params.id);
    res.json({ success: true, data: input, message: 'Planning input activated' });
  } catch (e) {
    next(e);
  }
};

// ────────────────────────────────────────────────────────────────────────────────
// SUMMARY
// ────────────────────────────────────────────────────────────────────────────────

export const getSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const totalScenarios = await WorkforcePlanningScenario.countDocuments();
    const activeScenarioCount = await WorkforcePlanningScenario.countDocuments({ status: 'ACTIVE' });
    const activeScenario = await WorkforcePlanningScenario.findOne({ status: 'ACTIVE' })
      .populate('createdBy', 'name email');
    const activePlanningInput = await WorkforcePlanningInput.findOne({ isActive: true })
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      data: {
        totalScenarios,
        activeScenarioCount,
        activeScenario,
        activePlanningInput,
      },
    });
  } catch (e) {
    next(e);
  }
};
