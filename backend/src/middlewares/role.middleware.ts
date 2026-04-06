import { Response, NextFunction } from 'express';
import { ApiError } from '../utils';
import { AuthenticatedRequest, UserRole } from '../types';

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized('Authentication required'));
      return;
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      next(ApiError.forbidden(`Role '${req.user.role}' is not authorized to access this resource`));
      return;
    }

    next();
  };
};
