import { Request, Response, NextFunction } from 'express';
import { ComplianceFiling } from './compliance.model';
import { AppError } from '../../middlewares/errorHandler';
import { createAuditLog } from '../logs/log.service';

export const getFilings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, filingType, departmentId } = req.query;
    const query: any = {};
    if (status) query.status = status;
    if (filingType) query.filingType = filingType;
    if (departmentId) query.departmentId = departmentId;
    const filings = await ComplianceFiling.find(query)
      .populate('departmentId', 'name code')
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1 });
    res.json({ success: true, data: filings });
  } catch (error) {
    next(error);
  }
};

export const createFiling = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filing = new ComplianceFiling({
      ...req.body,
      createdBy: req.user!.id,
    });
    await filing.save();
    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'CREATE',
      module: 'Compliance',
      resourceType: 'filing',
      resourceId: filing._id.toString(),
      ipAddress: req.ip || 'unknown',
    });
    res.status(201).json({ success: true, data: filing });
  } catch (error) {
    next(error);
  }
};

export const updateFiling = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (updateData.submittedDate) {
      updateData.status = 'SUBMITTED';
    }
    const filing = await ComplianceFiling.findByIdAndUpdate(id, updateData, { new: true });
    if (!filing) throw new AppError(404, 'Filing not found');
    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'UPDATE',
      module: 'Compliance',
      resourceType: 'filing',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
    });
    res.json({ success: true, data: filing });
  } catch (error) {
    next(error);
  }
};

export const deleteFiling = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await ComplianceFiling.findByIdAndDelete(id);
    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'DELETE',
      module: 'Compliance',
      resourceType: 'filing',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
    });
    res.json({ success: true, message: 'Filing deleted' });
  } catch (error) {
    next(error);
  }
};
