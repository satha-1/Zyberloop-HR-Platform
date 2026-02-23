import { Notification, INotification } from './notification.model';
import mongoose from 'mongoose';

export interface CreateNotificationParams {
  userId: string | mongoose.Types.ObjectId;
  type: INotification['type'];
  title: string;
  message: string;
  entityType: INotification['entityType'];
  entityId?: string | mongoose.Types.ObjectId | null;
}

export async function createNotification(params: CreateNotificationParams): Promise<INotification> {
  const notification = new Notification({
    userId: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    entityType: params.entityType,
    entityId: params.entityId || null,
    isRead: false,
  });

  return await notification.save();
}

export async function getUnreadCount(userId: string | mongoose.Types.ObjectId): Promise<number> {
  return await Notification.countDocuments({
    userId: new mongoose.Types.ObjectId(userId),
    isRead: false,
  });
}
