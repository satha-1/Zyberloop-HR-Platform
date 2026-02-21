import { Request, Response, NextFunction } from 'express';
import { AuditLog } from './log.model';
import { AppError } from '../../middlewares/errorHandler';

export const getLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { search, module, action, page = '1', limit = '50' } = req.query;

    const query: any = {};

    if (search) {
      query.$or = [
        { actorName: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { module: { $regex: search, $options: 'i' } },
        { resourceId: { $regex: search, $options: 'i' } },
      ];
    }

    if (module && module !== 'all') {
      query.module = module;
    }

    if (action && action !== 'all') {
      query.action = action;
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const logs = await AuditLog.find(query)
      .populate('actorId', 'email name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await AuditLog.countDocuments(query);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const exportLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // TODO: Implement async export job
    res.json({
      success: true,
      message: 'Export job created. Download link will be available shortly.',
    });
  } catch (error) {
    next(error);
  }
};
