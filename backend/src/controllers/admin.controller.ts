import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { AdminService } from '../services/admin.service';

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await AdminService.getAllUsers();
  res.status(200).json(new ApiResponse(200, users, 'Users fetched successfully'));
});

export const getStudents = asyncHandler(async (req: Request, res: Response) => {
  const students = await AdminService.getStudents();
  res.status(200).json(new ApiResponse(200, students, 'Students fetched successfully'));
});

export const getFacultyList = asyncHandler(async (req: Request, res: Response) => {
  const faculty = await AdminService.getFacultyList();
  res.status(200).json(new ApiResponse(200, faculty, 'Faculty fetched successfully'));
});

export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await AdminService.getDashboardStats();
  res.status(200).json(new ApiResponse(200, stats, 'Stats fetched successfully'));
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await AdminService.createUser(req.body);
  res.status(201).json(new ApiResponse(201, user, 'User created successfully'));
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await AdminService.getUserById(req.params.id);
  res.status(200).json(new ApiResponse(200, user, 'User fetched successfully'));
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await AdminService.updateUser(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, user, 'User updated successfully'));
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  await AdminService.deleteUser(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'User deleted successfully'));
});

export const getDepartments = asyncHandler(async (req: Request, res: Response) => {
  const departments = await AdminService.getDepartments();
  res.status(200).json(new ApiResponse(200, departments, 'Departments fetched successfully'));
});

export const createDepartment = asyncHandler(async (req: Request, res: Response) => {
  const dept = await AdminService.createDepartment(req.body);
  res.status(201).json(new ApiResponse(201, dept, 'Department created successfully'));
});

export const deleteDepartment = asyncHandler(async (req: Request, res: Response) => {
  await AdminService.deleteDepartment(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Department deleted successfully'));
});

export const getCourses = asyncHandler(async (req: Request, res: Response) => {
  const { departmentId } = req.query;
  const courses = await AdminService.getCourses(departmentId as string | undefined);
  res.status(200).json(new ApiResponse(200, courses, 'Courses fetched successfully'));
});

export const createCourse = asyncHandler(async (req: Request, res: Response) => {
  const course = await AdminService.createCourse(req.body);
  res.status(201).json(new ApiResponse(201, course, 'Course created successfully'));
});

export const getSubjects = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.query;
  const subjects = await AdminService.getSubjects(courseId as string | undefined);
  res.status(200).json(new ApiResponse(200, subjects, 'Subjects fetched successfully'));
});

export const createSubject = asyncHandler(async (req: Request, res: Response) => {
  const subject = await AdminService.createSubject(req.body);
  res.status(201).json(new ApiResponse(201, subject, 'Subject created successfully'));
});

export const createStudent = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, phone, gender, date_of_birth, profilePhoto, ...studentData } = req.body;
  const hashedPassword = await bcrypt.hash(password || 'Student@123', 10);
  const result = await AdminService.createStudent(
    { name, email, password: hashedPassword, phone, role: 'student', is_active: true },
    { ...studentData, ...(gender && { gender }), ...(date_of_birth && { date_of_birth }) }
  );
  res.status(201).json(new ApiResponse(201, result, 'Student registered successfully'));
});

export const createFaculty = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, phone, gender, profilePhoto, ...facultyData } = req.body;
  const hashedPassword = await bcrypt.hash(password || 'Faculty@123', 10);
  const result = await AdminService.createFaculty(
    { name, email, password: hashedPassword, phone, role: 'faculty', is_active: true },
    { ...facultyData, ...(gender && { gender }) }
  );
  res.status(201).json(new ApiResponse(201, result, 'Faculty registered successfully'));
});

export const getTeachingAssignments = asyncHandler(async (req: Request, res: Response) => {
  const assignments = await AdminService.getTeachingAssignments();
  res.status(200).json(new ApiResponse(200, assignments, 'Teaching assignments fetched successfully'));
});

export const createTeachingAssignment = asyncHandler(async (req: Request, res: Response) => {
  const assignment = await AdminService.createTeachingAssignment(req.body);
  res.status(201).json(new ApiResponse(201, assignment, 'Teaching assignment created successfully'));
});

export const deleteTeachingAssignment = asyncHandler(async (req: Request, res: Response) => {
  await AdminService.deleteTeachingAssignment(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Teaching assignment deleted successfully'));
});
