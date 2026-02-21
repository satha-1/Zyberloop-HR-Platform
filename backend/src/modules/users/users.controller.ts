import { Request, Response, NextFunction } from 'express';
import { User } from './user.model';
import { AppError } from '../../middlewares/errorHandler';

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await User.find({}, { passwordHash: 0 })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id, { passwordHash: 0 });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
