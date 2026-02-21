import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { User } from './user.model';
import { AppError } from '../../middlewares/errorHandler';
import { createAuditLog } from '../logs/log.service';

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { search, role, status } = req.query;
    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) {
      query.roles = role;
    }

    if (status) {
      query.status = status;
    }

    const users = await User.find(query, { passwordHash: 0 })
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

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, name, roles, status } = req.body;

    if (!email || !password || !name) {
      throw new AppError(400, 'Email, password, and name are required');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      email: email.toLowerCase(),
      passwordHash,
      name,
      roles: roles || ['USER'],
      status: status || 'ACTIVE',
    });

    await user.save();

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'CREATE',
      module: 'Users',
      resourceType: 'user',
      resourceId: user._id.toString(),
      ipAddress: req.ip || 'unknown',
    });

    const userResponse = user.toObject();
    delete (userResponse as any).passwordHash;

    res.status(201).json({
      success: true,
      data: userResponse,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      throw new AppError(400, 'Email already exists');
    }
    next(error);
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { password, ...updateData } = req.body;

    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select('-passwordHash');

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'UPDATE',
      module: 'Users',
      resourceType: 'user',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'DELETE',
      module: 'Users',
      resourceType: 'user',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
