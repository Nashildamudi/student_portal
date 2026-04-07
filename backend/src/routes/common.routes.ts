import { Router } from 'express';
import { adminService } from '../services';
import { asyncHandler, ApiResponse } from '../utils';

const router = Router();

// Public routes for dropdowns (used in registration)
router.get('/departments', asyncHandler(async (_req, res) => {
  const departments = await adminService.getDepartments();
  res.json(ApiResponse.ok(departments, 'Departments fetched'));
}));

router.get('/courses', asyncHandler(async (req, res) => {
  const departmentId = req.query.departmentId as string | undefined;
  const courses = await adminService.getCourses(departmentId);
  res.json(ApiResponse.ok(courses, 'Courses fetched'));
}));

router.get('/subjects', asyncHandler(async (req, res) => {
  const courseId = req.query.courseId as string | undefined;
  const semester = req.query.semester ? parseInt(req.query.semester as string) : undefined;
  const subjects = await adminService.getSubjects(courseId, semester);
  res.json(ApiResponse.ok(subjects, 'Subjects fetched'));
}));

export default router;
