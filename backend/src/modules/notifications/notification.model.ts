import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'NEW_CANDIDATE' | 'CANDIDATE_MOVED_STAGE' | 'TASK_ASSIGNED' | 'TASK_DUE' | 'SYSTEM';
  title: string;
  message: string;
  entityType: 'REQUISITION' | 'CANDIDATE' | 'TASK' | 'SYSTEM';
  entityId: mongoose.Types.ObjectId | null;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['NEW_CANDIDATE', 'CANDIDATE_MOVED_STAGE', 'TASK_ASSIGNED', 'TASK_DUE', 'SYSTEM'],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    entityType: {
      type: String,
      enum: ['REQUISITION', 'CANDIDATE', 'TASK', 'SYSTEM'],
      required: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
