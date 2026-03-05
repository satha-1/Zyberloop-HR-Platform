import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { uploadEmployeeDocuments } from '../../middlewares/upload';
import {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getAssignments,
  createAssignment,
  updateAssignment,
  uploadCourseMaterial,
} from './learning.controller';

export const learningRouter = Router();

learningRouter.use(authenticate);

// Courses
learningRouter.get('/courses', getCourses);
learningRouter.post('/courses', createCourse);
learningRouter.post('/courses/:id/materials', uploadEmployeeDocuments.single('file'), uploadCourseMaterial);
learningRouter.patch('/courses/:id', updateCourse);
learningRouter.delete('/courses/:id', deleteCourse);

// Assignments
learningRouter.get('/assignments', getAssignments);
learningRouter.post('/assignments', createAssignment);
learningRouter.patch('/assignments/:id', updateAssignment);
