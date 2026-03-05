import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError | any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Operational errors (AppError)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      },
    });
  }

  // Mongoose ValidationError → 400
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        message: Object.values((err as any).errors).map((val: any) => val.message).join(', '),
      },
    });
  }

  // Mongoose CastError (bad ObjectId) → 400
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        message: `Invalid ${(err as any).path}: ${(err as any).value}`,
      },
    });
  }

  // Mongoose duplicate key → 409
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {}).join(', ');
    return res.status(409).json({
      success: false,
      error: { message: `Duplicate value for: ${field || 'unknown field'}` },
    });
  }

  // Unknown errors
  console.error('Unhandled error:', err);
  return res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};
