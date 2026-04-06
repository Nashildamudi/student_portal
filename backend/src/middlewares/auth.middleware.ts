import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError';
import { User, IUser } from '../models/user.model';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Unauthorized request. No token provided.');
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.BETTER_AUTH_SECRET || 'fallback_secret';

    const decoded = jwt.verify(token, secret) as { id: string; role: string };

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      throw new ApiError(401, 'Unauthorized request. User not found.');
    }

    req.user = user;
    next();
  } catch (error: any) {
    next(new ApiError(401, error.message || 'Unauthorized request. Invalid token.'));
  }
};
