import { Router, Request, Response } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { Department } from '../models/department.model';
import { Course } from '../models/course.model';
import { Subject } from '../models/subject.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';

const router = Router();

// Public route - no auth needed (for registration dropdowns)
router.get('/public/dropdowns', asyncHandler(async (req: Request, res: Response) => {
  const departments = await Department.find().select('name code');
  const courses = await Course.find().select('name code department_id').populate('department_id', 'name code');
  res.status(200).json(new ApiResponse(200, { departments, courses }));
}));

router.use(authenticate);

router.get('/profile', asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(new ApiResponse(200, req.user));
}));

router.patch('/profile', asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(new ApiResponse(200, {}, "Profile updated"));
}));

router.get('/dropdowns', asyncHandler(async (req: Request, res: Response) => {
  const departments = await Department.find().select('name code');
  const courses = await Course.find().select('name code department_id');
  const subjects = await Subject.find().select('name code course_id semester');
  res.status(200).json(new ApiResponse(200, { departments, courses, subjects }));
}));

export default router;
