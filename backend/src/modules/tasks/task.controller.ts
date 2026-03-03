import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Task } from './task.model';
import { AppError } from '../../middlewares/errorHandler';
import { createNotification } from '../notifications/notification.service';
import { createTask as createTaskService } from './task.service';

export const getTasks = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { status, priority, overdue, limit = '50', offset = '0' } = req.query;

    const query: any = { userId: new mongoose.Types.ObjectId(userId) };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    if (overdue === 'true') {
      query.dueDate = { $lt: new Date() };
      query.status = { $in: ['NEW', 'IN_PROGRESS'] };
    }

    const tasks = await Task.find(query)
      .sort({ dueDate: 1, createdAt: -1 })
      .limit(parseInt(limit as string, 10))
      .skip(parseInt(offset as string, 10))
      .lean();

    const totalCount = await Task.countDocuments(query);

    // Get active task count (NEW or IN_PROGRESS, not overdue)
    const activeCount = await Task.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      status: { $in: ['NEW', 'IN_PROGRESS'] },
      $or: [
        { dueDate: null },
        { dueDate: { $gte: new Date() } },
      ],
    });

    res.json({
      success: true,
      data: tasks,
      pagination: {
        total: totalCount,
        active: activeCount,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const task = await Task.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!task) {
      throw new AppError(404, 'Task not found');
    }

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const task = await createTaskService({
      userId: req.user!.id,
      title: req.body.title,
      description: req.body.description,
      relatedEntityType: req.body.relatedEntityType,
      relatedEntityId: req.body.relatedEntityId,
      priority: req.body.priority,
      dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
    });

    // Create notification for task assignment
    await createNotification({
      userId: task.userId,
      type: 'TASK_ASSIGNED',
      title: 'New Task Assigned',
      message: `You have been assigned a new task: ${task.title}`,
      entityType: 'TASK',
      entityId: task._id,
    });

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const task = await Task.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!task) {
      throw new AppError(404, 'Task not found');
    }

    // Update fields
    Object.keys(req.body).forEach((key) => {
      if (key !== 'userId' && key !== '_id') {
        (task as any)[key] = req.body[key];
      }
    });

    await task.save();

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

export const getActiveTaskCount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const count = await Task.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      status: { $in: ['NEW', 'IN_PROGRESS'] },
      $or: [
        { dueDate: null },
        { dueDate: { $gte: new Date() } },
      ],
    });

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
};
