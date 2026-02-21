import { Request, Response, NextFunction } from 'express';
import { LearningCourse, LearningAssignment } from './learning.model';
import { AppError } from '../../middlewares/errorHandler';
import { createAuditLog } from '../logs/log.service';

// Courses
export const getCourses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, status } = req.query;
    const query: any = {};
    if (category) query.category = category;
    if (status) query.status = status;
    const courses = await LearningCourse.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: courses });
  } catch (error) {
    next(error);
  }
};

export const createCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const course = new LearningCourse(req.body);
    await course.save();
    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'CREATE',
      module: 'Learning',
      resourceType: 'course',
      resourceId: course._id.toString(),
      ipAddress: req.ip || 'unknown',
    });
    res.status(201).json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

export const updateCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const course = await LearningCourse.findByIdAndUpdate(id, req.body, { new: true });
    if (!course) throw new AppError(404, 'Course not found');
    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'UPDATE',
      module: 'Learning',
      resourceType: 'course',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
    });
    res.json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

export const deleteCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await LearningCourse.findByIdAndDelete(id);
    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'DELETE',
      module: 'Learning',
      resourceType: 'course',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
    });
    res.json({ success: true, message: 'Course deleted' });
  } catch (error) {
    next(error);
  }
};

// Assignments
export const getAssignments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employeeId, courseId, status } = req.query;
    const query: any = {};
    if (employeeId) query.employeeId = employeeId;
    if (courseId) query.courseId = courseId;
    if (status) query.status = status;
    const assignments = await LearningAssignment.find(query)
      .populate('employeeId', 'firstName lastName employeeCode')
      .populate('courseId', 'title duration')
      .populate('assignedBy', 'name email');
    res.json({ success: true, data: assignments });
  } catch (error) {
    next(error);
  }
};

export const createAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assignment = new LearningAssignment({
      ...req.body,
      assignedBy: req.user!.id,
    });
    await assignment.save();
    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'CREATE',
      module: 'Learning',
      resourceType: 'assignment',
      resourceId: assignment._id.toString(),
      ipAddress: req.ip || 'unknown',
    });
    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
};

export const updateAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (updateData.progress === 100) {
      updateData.status = 'COMPLETED';
      updateData.completedAt = new Date();
    }
    const assignment = await LearningAssignment.findByIdAndUpdate(id, updateData, { new: true });
    if (!assignment) throw new AppError(404, 'Assignment not found');
    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'UPDATE',
      module: 'Learning',
      resourceType: 'assignment',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
    });
    res.json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
};
