import { Response } from 'express';
import { studentService } from '../services';
import { ApiResponse, asyncHandler } from '../utils';
import { AuthenticatedRequest } from '../types';

export const studentController = {
  getMyProfile: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profile = await studentService.getMyProfile(req.user!._id.toString());
    res.json(ApiResponse.ok(profile, 'Profile fetched successfully'));
  }),

  getMyAttendance: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const attendance = await studentService.getMyAttendance(req.user!._id.toString());
    res.json(ApiResponse.ok(attendance, 'Attendance fetched successfully'));
  }),

  getMyMarks: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const marks = await studentService.getMyMarks(req.user!._id.toString());
    res.json(ApiResponse.ok(marks, 'Marks fetched successfully'));
  }),

  getMyMaterials: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const materials = await studentService.getMyMaterials(req.user!._id.toString());
    res.json(ApiResponse.ok(materials, 'Materials fetched successfully'));
  }),
};
