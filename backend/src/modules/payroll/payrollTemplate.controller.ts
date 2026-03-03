import { Request, Response, NextFunction } from 'express';
import { PayrollTemplate, IPayrollTemplate } from './payrollTemplate.model';
import { AppError } from '../../middlewares/errorHandler';
import { createAuditLog } from '../logs/log.service';
import mongoose from 'mongoose';

export const getPayrollTemplates = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { search, payFrequency, isActive, page = 1, limit = 50 } = req.query;

    const query: any = {};

    if (search && typeof search === 'string') {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (payFrequency && payFrequency !== 'all') {
      query.payFrequency = payFrequency;
    }

    if (isActive !== undefined && isActive !== 'all') {
      const isActiveValue = typeof isActive === 'string' 
        ? isActive === 'true' 
        : Boolean(isActive);
      query.isActive = isActiveValue;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const templates = await PayrollTemplate.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await PayrollTemplate.countDocuments(query);

    res.json({
      success: true,
      data: templates.map((template) => ({
        id: template._id.toString(),
        name: template.name,
        description: template.description,
        payFrequency: template.payFrequency,
        currency: template.currency,
        isActive: template.isActive,
        effectiveFrom: template.effectiveFrom.toISOString(),
        effectiveTo: template.effectiveTo?.toISOString(),
        defaultPayItems: template.defaultPayItems,
        taxConfig: template.taxConfig,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPayrollTemplateById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, 'Invalid template ID');
    }

    const template = await PayrollTemplate.findById(id);

    if (!template) {
      throw new AppError(404, 'Payroll template not found');
    }

    res.json({
      success: true,
      data: {
        id: template._id.toString(),
        name: template.name,
        description: template.description,
        payFrequency: template.payFrequency,
        currency: template.currency,
        isActive: template.isActive,
        effectiveFrom: template.effectiveFrom.toISOString(),
        effectiveTo: template.effectiveTo?.toISOString(),
        defaultPayItems: template.defaultPayItems,
        taxConfig: template.taxConfig,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createPayrollTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      description,
      payFrequency,
      currency,
      isActive,
      effectiveFrom,
      effectiveTo,
      defaultPayItems,
      taxConfig,
    } = req.body;

    // Validation
    if (!name || !payFrequency || !currency || !effectiveFrom) {
      throw new AppError(400, 'Name, payFrequency, currency, and effectiveFrom are required');
    }

    // Validate pay items
    if (defaultPayItems && Array.isArray(defaultPayItems)) {
      for (const item of defaultPayItems) {
        if (item.calculationType === 'flat' && (item.amount === null || item.amount === undefined)) {
          throw new AppError(400, `Pay item "${item.label || item.code}" requires an amount for flat calculation`);
        }
        if (item.calculationType === 'percentage' && (item.percentage === null || item.percentage === undefined)) {
          throw new AppError(400, `Pay item "${item.label || item.code}" requires a percentage for percentage calculation`);
        }
      }
    }

    const template = new PayrollTemplate({
      name,
      description,
      payFrequency,
      currency: currency || 'LKR',
      isActive: isActive !== undefined ? isActive : true,
      effectiveFrom: new Date(effectiveFrom),
      effectiveTo: effectiveTo ? new Date(effectiveTo) : undefined,
      defaultPayItems: defaultPayItems || [],
      taxConfig: taxConfig || {
        country: 'Sri Lanka',
        taxYear: new Date().getFullYear(),
        hasProgressiveTax: true,
      },
    });

    await template.save();

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'CREATE',
      module: 'Payroll',
      resourceType: 'payroll_template',
      resourceId: template._id.toString(),
      ipAddress: req.ip || 'unknown',
    });

    res.status(201).json({
      success: true,
      data: {
        id: template._id.toString(),
        name: template.name,
        description: template.description,
        payFrequency: template.payFrequency,
        currency: template.currency,
        isActive: template.isActive,
        effectiveFrom: template.effectiveFrom.toISOString(),
        effectiveTo: template.effectiveTo?.toISOString(),
        defaultPayItems: template.defaultPayItems,
        taxConfig: template.taxConfig,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updatePayrollTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, 'Invalid template ID');
    }

    const template = await PayrollTemplate.findById(id);

    if (!template) {
      throw new AppError(404, 'Payroll template not found');
    }

    // Validate pay items if provided
    if (updates.defaultPayItems && Array.isArray(updates.defaultPayItems)) {
      for (const item of updates.defaultPayItems) {
        if (item.calculationType === 'flat' && (item.amount === null || item.amount === undefined)) {
          throw new AppError(400, `Pay item "${item.label || item.code}" requires an amount for flat calculation`);
        }
        if (item.calculationType === 'percentage' && (item.percentage === null || item.percentage === undefined)) {
          throw new AppError(400, `Pay item "${item.label || item.code}" requires a percentage for percentage calculation`);
        }
      }
    }

    // Update fields
    if (updates.name) template.name = updates.name;
    if (updates.description !== undefined) template.description = updates.description;
    if (updates.payFrequency) template.payFrequency = updates.payFrequency;
    if (updates.currency) template.currency = updates.currency;
    if (updates.isActive !== undefined) template.isActive = updates.isActive;
    if (updates.effectiveFrom) template.effectiveFrom = new Date(updates.effectiveFrom);
    if (updates.effectiveTo !== undefined) {
      template.effectiveTo = updates.effectiveTo ? new Date(updates.effectiveTo) : undefined;
    }
    if (updates.defaultPayItems) template.defaultPayItems = updates.defaultPayItems;
    if (updates.taxConfig) template.taxConfig = { ...template.taxConfig, ...updates.taxConfig };

    await template.save();

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'UPDATE',
      module: 'Payroll',
      resourceType: 'payroll_template',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
    });

    res.json({
      success: true,
      data: {
        id: template._id.toString(),
        name: template.name,
        description: template.description,
        payFrequency: template.payFrequency,
        currency: template.currency,
        isActive: template.isActive,
        effectiveFrom: template.effectiveFrom.toISOString(),
        effectiveTo: template.effectiveTo?.toISOString(),
        defaultPayItems: template.defaultPayItems,
        taxConfig: template.taxConfig,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deletePayrollTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, 'Invalid template ID');
    }

    const template = await PayrollTemplate.findByIdAndDelete(id);

    if (!template) {
      throw new AppError(404, 'Payroll template not found');
    }

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'DELETE',
      module: 'Payroll',
      resourceType: 'payroll_template',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
    });

    res.json({
      success: true,
      message: 'Payroll template deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const duplicatePayrollTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, 'Invalid template ID');
    }

    const originalTemplate = await PayrollTemplate.findById(id);

    if (!originalTemplate) {
      throw new AppError(404, 'Payroll template not found');
    }

    // Create a duplicate with a new name
    const duplicate = new PayrollTemplate({
      name: `${originalTemplate.name} (Copy)`,
      description: originalTemplate.description,
      payFrequency: originalTemplate.payFrequency,
      currency: originalTemplate.currency,
      isActive: false, // Duplicates are inactive by default
      effectiveFrom: new Date(),
      effectiveTo: originalTemplate.effectiveTo,
      defaultPayItems: originalTemplate.defaultPayItems.map((item) => ({ ...(item as any).toObject?.() || item })),
      taxConfig: { ...(originalTemplate.taxConfig as any).toObject?.() || originalTemplate.taxConfig },
    });

    await duplicate.save();

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'CREATE',
      module: 'Payroll',
      resourceType: 'payroll_template',
      resourceId: duplicate._id.toString(),
      ipAddress: req.ip || 'unknown',
    });

    res.status(201).json({
      success: true,
      data: {
        id: duplicate._id.toString(),
        name: duplicate.name,
        description: duplicate.description,
        payFrequency: duplicate.payFrequency,
        currency: duplicate.currency,
        isActive: duplicate.isActive,
        effectiveFrom: duplicate.effectiveFrom.toISOString(),
        effectiveTo: duplicate.effectiveTo?.toISOString(),
        defaultPayItems: duplicate.defaultPayItems,
        taxConfig: duplicate.taxConfig,
        createdAt: duplicate.createdAt.toISOString(),
        updatedAt: duplicate.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};
