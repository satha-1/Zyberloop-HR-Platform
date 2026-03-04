import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Task } from "./task.model";
import { Employee } from "../employees/employee.model";
import { User } from "../users/user.model";
import { AppError } from "../../middlewares/errorHandler";
import { createNotification } from "../notifications/notification.service";
import { createTask as createTaskService } from "./task.service";

export const getTasks = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      status,
      priority,
      overdue,
      limit = "50",
      offset = "0",
      userId: targetUserId,
      filterType,
    } = req.query;

    let query: any = {};

    if (filterType === "assigned") {
      query.assignedBy = new mongoose.Types.ObjectId(req.user!.id);
    } else if (filterType === "involved") {
      // Both assigned to and assigned by
      const targetUserIds: mongoose.Types.ObjectId[] = [
        new mongoose.Types.ObjectId(req.user!.id),
      ];
      const employee = await Employee.findOne({ userId: req.user!.id });
      if (employee) {
        targetUserIds.push(employee._id as mongoose.Types.ObjectId);
      }
      query.$or = [
        { userId: { $in: targetUserIds } },
        { assignedBy: new mongoose.Types.ObjectId(req.user!.id) },
      ];
    } else if (
      filterType === "all" &&
      (req.user!.roles.includes("ADMIN") ||
        req.user!.roles.includes("HR_ADMIN") ||
        req.user!.roles.includes("MANAGER"))
    ) {
      // All tasks for the organization (Admins/Managers only)
      query = {};
    } else {
      // Default to current user's tasks (both User ID and Employee ID)
      const targetUserIds: mongoose.Types.ObjectId[] = [
        new mongoose.Types.ObjectId(req.user!.id),
      ];

      // Try to find the associated employee profile to include tasks assigned to it
      const employee = await Employee.findOne({ userId: req.user!.id });
      if (employee) {
        targetUserIds.push(employee._id as mongoose.Types.ObjectId);
      }

      // If a specific targetUserId is provided (by Admin/Manager)
      if (
        targetUserId &&
        (req.user!.roles.includes("ADMIN") ||
          req.user!.roles.includes("HR_ADMIN") ||
          req.user!.roles.includes("MANAGER"))
      ) {
        query.userId = new mongoose.Types.ObjectId(targetUserId as string);
      } else {
        query.userId = { $in: targetUserIds };
      }
    }

    if (status && status !== "all") {
      query.status = status;
    }

    if (priority && priority !== "all") {
      query.priority = priority;
    }

    if (overdue === "true") {
      query.dueDate = { $lt: new Date() };
      query.status = { $in: ["NEW", "IN_PROGRESS"] };
    }

    const tasks = await Task.find(query)
      .sort({ dueDate: 1, createdAt: -1 })
      .limit(parseInt(limit as string, 10))
      .skip(parseInt(offset as string, 10))
      .lean();

    const totalCount = await Task.countDocuments(query);

    // Get active task count (NEW or IN_PROGRESS, not overdue)
    const activeCount = await Task.countDocuments({
      ...query,
      status: { $in: ["NEW", "IN_PROGRESS"] },
      $or: [{ dueDate: null }, { dueDate: { $gte: new Date() } }],
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
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const task = await Task.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!task) {
      throw new AppError(404, "Task not found");
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
  next: NextFunction,
) => {
  try {
    let targetUserId = req.user!.id;

    // Resolve employee code if provided
    if (req.body.employeeCode) {
      const employee = await Employee.findOne({
        employeeCode: req.body.employeeCode.toUpperCase(),
      });
      if (!employee) {
        throw new AppError(
          404,
          `Employee with code ${req.body.employeeCode} not found`,
        );
      }

      let userId = employee.userId;

      // Automatically link user if missing but email exists
      if (!userId && employee.email) {
        const cleanEmail = employee.email.toLowerCase().trim();
        // Try exact match first
        let user = await User.findOne({ email: cleanEmail });

        // If not found, try case-insensitive regex to be extra safe
        if (!user) {
          user = await User.findOne({
            email: {
              $regex: new RegExp(
                `^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
                "i",
              ),
            },
          });
        }

        // If still not found, try by name as a fallback (carefully)
        if (!user) {
          user = await User.findOne({
            name: { $regex: new RegExp(`^${employee.fullName}$`, "i") },
            status: "ACTIVE",
          });
        }

        if (user) {
          employee.userId = user._id;
          await employee.save();
          userId = user._id;
        }
      }

      // If a user account isn't found, we'll fall back and use the employee ID
      // directly. This allows tasks to be assigned to HR profiles even before they
      // receive official login access.
      targetUserId = userId ? userId.toString() : employee._id.toString();
    } else if (req.body.userId) {
      targetUserId = req.body.userId;
    }

    const task = await createTaskService({
      userId: targetUserId,
      assignedBy: req.user!.id,
      title: req.body.title,
      description: req.body.description,
      relatedEntityType: req.body.relatedEntityType || "PROFILE",
      relatedEntityId: req.body.relatedEntityId || null,
      priority: req.body.priority,
      dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
    });

    // Create notification for task assignment
    await createNotification({
      userId: task.userId,
      type: "TASK_ASSIGNED",
      title: "New Task Assigned",
      message: `You have been assigned a new task: ${task.title}`,
      entityType: "TASK",
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
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const task = await Task.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!task) {
      throw new AppError(404, "Task not found");
    }

    // Update fields
    Object.keys(req.body).forEach((key) => {
      if (key !== "userId" && key !== "_id") {
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
  next: NextFunction,
) => {
  try {
    const userId = req.user!.id;

    const count = await Task.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      status: { $in: ["NEW", "IN_PROGRESS"] },
      $or: [{ dueDate: null }, { dueDate: { $gte: new Date() } }],
    });

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
};
