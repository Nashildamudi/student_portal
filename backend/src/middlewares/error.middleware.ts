import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils';
import { env } from '../config';

interface ErrorResponse {
  success: boolean;
  message: string;
  errors?: unknown[];
  stack?: string;
}

export const errorHandler = (
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: unknown[] = [];

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values((err as unknown as { errors: Record<string, { message: string }> }).errors || {}).map(
      (e) => e.message
    );
  } else if (err.name === 'CastError') {
    // Mongoose cast error (invalid ObjectId)
    statusCode = 400;
    message = 'Invalid ID format';
  } else if ((err as unknown as { code: number }).code === 11000) {
    // MongoDB duplicate key error
    statusCode = 409;
    const field = Object.keys((err as unknown as { keyValue: Record<string, unknown> }).keyValue || {})[0];
    message = `${field ? field.charAt(0).toUpperCase() + field.slice(1) : 'Field'} already exists`;
  }

  const response: ErrorResponse = {
    success: false,
    message,
  };

  if (errors.length > 0) {
    response.errors = errors;
  }

  if (env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction): void => {
  next(ApiError.notFound('Route not found'));
};
