import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { templateService } from './services/template.service';
import { createAuditLog } from '../logs/log.service';
import { AppError } from '../../middlewares/errorHandler';

export const createTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const template = await templateService.createTemplate({
      ...req.body,
      createdBy: req.user!.id,
    });

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'TEMPLATE_CREATE',
      module: 'DOCUMENTS',
      resourceType: 'template',
      resourceId: template._id.toString(),
      ipAddress: req.ip || 'unknown',
    });

    res.status(201).json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
};

export const getTemplates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const templates = await templateService.getTemplates({
      docType: req.query.docType as any,
      status: req.query.status as any,
      locale: req.query.locale as string,
      search: req.query.search as string,
    });

    res.json({ success: true, data: templates });
  } catch (error) {
    next(error);
  }
};

export const getTemplateById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const template = await templateService.getTemplateById(req.params.id);
    if (!template) {
      throw new AppError(404, 'Template not found');
    }
    res.json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
};

export const updateTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const template = await templateService.updateTemplate(req.params.id, req.body);

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'TEMPLATE_EDIT',
      module: 'DOCUMENTS',
      resourceType: 'template',
      resourceId: req.params.id,
      ipAddress: req.ip || 'unknown',
    });

    res.json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
};

export const submitForReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const template = await templateService.submitForReview(req.params.id);

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'TEMPLATE_SUBMIT_REVIEW',
      module: 'DOCUMENTS',
      resourceType: 'template',
      resourceId: req.params.id,
      ipAddress: req.ip || 'unknown',
    });

    res.json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
};

export const approveTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const template = await templateService.approveTemplate(
      req.params.id,
      new mongoose.Types.ObjectId(req.user!.id),
      req.user!.name || req.user!.email || 'Unknown',
      req.body.notes
    );

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'TEMPLATE_APPROVE',
      module: 'DOCUMENTS',
      resourceType: 'template',
      resourceId: req.params.id,
      ipAddress: req.ip || 'unknown',
    });

    res.json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
};

export const publishTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const template = await templateService.publishTemplate(
      req.params.id,
      req.body.effectiveFrom ? new Date(req.body.effectiveFrom) : undefined,
      req.body.effectiveTo ? new Date(req.body.effectiveTo) : undefined
    );

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'TEMPLATE_PUBLISH',
      module: 'DOCUMENTS',
      resourceType: 'template',
      resourceId: template._id.toString(),
      ipAddress: req.ip || 'unknown',
    });

    res.json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
};

export const deprecateTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const template = await templateService.deprecateTemplate(req.params.id);

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'TEMPLATE_DEPRECATE',
      module: 'DOCUMENTS',
      resourceType: 'template',
      resourceId: req.params.id,
      ipAddress: req.ip || 'unknown',
    });

    res.json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
};
