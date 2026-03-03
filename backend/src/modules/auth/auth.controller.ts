import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '../users/user.model';
import { config } from '../../config';
import { AppError } from '../../middlewares/errorHandler';

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || user.status !== 'ACTIVE') {
      throw new AppError(401, 'Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid credentials');
    }

    const signOptions: SignOptions = {
      // @ts-ignore - expiresIn accepts string like '7d' which is valid
      expiresIn: config.jwt.expiresIn,
    };
    
    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        roles: user.roles,
      },
      config.jwt.secret,
      signOptions
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          roles: user.roles,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
