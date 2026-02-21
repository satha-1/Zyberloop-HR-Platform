import mongoose, { Schema, Document } from 'mongoose';

export interface ILearningCourse extends Document {
  title: string;
  description: string;
  category: string;
  duration: number; // in hours
  instructor: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
}

export interface ILearningAssignment extends Document {
  employeeId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  dueDate?: Date;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  progress: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const learningCourseSchema = new Schema<ILearningCourse>(
  {
    title: { type: String, required: true },
    description: String,
    category: String,
    duration: { type: Number, required: true },
    instructor: String,
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
      default: 'DRAFT',
    },
  },
  { timestamps: true }
);

const learningAssignmentSchema = new Schema<ILearningAssignment>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'LearningCourse',
      required: true,
      index: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dueDate: Date,
    status: {
      type: String,
      enum: ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'],
      default: 'ASSIGNED',
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    completedAt: Date,
  },
  { timestamps: true }
);

export const LearningCourse = mongoose.model<ILearningCourse>('LearningCourse', learningCourseSchema);
export const LearningAssignment = mongoose.model<ILearningAssignment>('LearningAssignment', learningAssignmentSchema);
