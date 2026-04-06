import { Request } from 'express';
import { IUser } from './models';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export interface JwtPayload {
  id: string;
  role: string;
  iat?: number;
  exp?: number;
}
