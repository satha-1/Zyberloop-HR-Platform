import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Notification } from './notification.model';
import { AppError } from '../../middlewares/errorHandler';
import { getUnreadCount } from './notification.service';

export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { onlyUnread, limit = '50', offset = '0' } = req.query;

    const query: any = { userId: new mongoose.Types.ObjectId(userId) };
    if (onlyUnread === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string, 10))
      .skip(parseInt(offset as string, 10))
      .lean();

    const totalCount = await Notification.countDocuments(query);
    const unreadCount = await getUnreadCount(userId);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        total: totalCount,
        unread: unreadCount,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const markNotificationAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const notification = await Notification.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!notification) {
      throw new AppError(404, 'Notification not found');
    }

    notification.isRead = true;
    await notification.save();

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    await Notification.updateMany(
      {
        userId: new mongoose.Types.ObjectId(userId),
        isRead: false,
      },
      {
        $set: { isRead: true },
      }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};

export const getUnreadNotificationCount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const count = await getUnreadCount(userId);

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
};
