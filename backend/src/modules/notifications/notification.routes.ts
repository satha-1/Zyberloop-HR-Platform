import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
} from './notification.controller';

export const notificationRouter = Router();

notificationRouter.use(authenticate);

notificationRouter.get('/', getNotifications);
notificationRouter.get('/unread-count', getUnreadNotificationCount);
notificationRouter.post('/:id/read', markNotificationAsRead);
notificationRouter.post('/read-all', markAllNotificationsAsRead);
