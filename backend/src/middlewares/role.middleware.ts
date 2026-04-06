import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized. Please login.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, `Role ${req.user.role} is not allowed to access this resource.`));
    }

    next();
  };
};
