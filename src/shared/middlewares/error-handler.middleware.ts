import type { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '@/core/interfaces/base.interface';
import { AppError } from '@/shared/errors/app.error';
import { logger } from '@/config/logger';
import { ZodError } from 'zod';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  let statusCode = 500;
  let message = 'Internal server error';
  let errors: string[] = [];

  // Handle custom AppError
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  }
  // Handle Zod validation errors
  else if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation error';
    errors = error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
  }
  // Handle Prisma errors
  else if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    
    switch (prismaError.code) {
      case 'P2002':
        statusCode = 409;
        message = 'Resource already exists';
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Resource not found';
        break;
      default:
        statusCode = 400;
        message = 'Database error';
    }
  }
  // Handle JWT errors
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }
  // Handle Multer errors
  else if (error.name === 'MulterError') {
    statusCode = 400;
    message = `File upload error: ${error.message}`;
  }

  // Log error for debugging
  if (statusCode >= 500) {
    logger.error('Internal server error:', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  } else {
    logger.warn('Client error:', {
      error: error.message,
      url: req.url,
      method: req.method,
      statusCode
    });
  }

  const response: ApiResponse = {
    success: false,
    message,
    ...(errors.length > 0 && { errors })
  };

  return res.status(statusCode).json(response);
};

export const notFoundHandler = (req: Request, res: Response): Response => {
  const response: ApiResponse = {
    success: false,
    message: `Route ${req.originalUrl} not found`
  };

  return res.status(404).json(response);
};