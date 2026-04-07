import { Response } from 'express';
import { authService } from '../services';
import { ApiResponse, asyncHandler } from '../utils';
import { AuthenticatedRequest } from '../types';

export const authController = {
  register: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { name, email, password, role, phone } = req.body;
    const result = await authService.register({ name, email, password, role, phone });
    res.status(201).json(ApiResponse.created(result, 'Registration successful'));
  }),

  login: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    res.json(ApiResponse.ok(result, 'Login successful'));
  }),

  getProfile: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const profile = await authService.getProfile(user._id.toString());
    res.json(ApiResponse.ok(profile, 'Profile fetched successfully'));
  }),
};
