import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { StudentService } from '../services/student.service';

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await StudentService.getProfile(req.user!.id);
  res.status(200).json(new ApiResponse(200, profile, 'Profile fetched successfully'));
});

export const getAttendance = asyncHandler(async (req: Request, res: Response) => {
  const data = await StudentService.getAttendance(req.user!.id);
  res.status(200).json(new ApiResponse(200, data, 'Attendance fetched successfully'));
});

export const getMarks = asyncHandler(async (req: Request, res: Response) => {
  const marks = await StudentService.getMarks(req.user!.id);
  res.status(200).json(new ApiResponse(200, marks, 'Marks fetched successfully'));
});

export const getMaterials = asyncHandler(async (req: Request, res: Response) => {
  const materials = await StudentService.getMaterials(req.user!.id);
  res.status(200).json(new ApiResponse(200, materials, 'Materials fetched successfully'));
});
