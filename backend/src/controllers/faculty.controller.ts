import { Request, Response } from 'express';
import path from 'path';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { FacultyService } from '../services/faculty.service';

export const getAssignments = asyncHandler(async (req: Request, res: Response) => {
  const assignments = await FacultyService.getAssignments(req.user!.id);
  res.status(200).json(new ApiResponse(200, assignments, 'Assignments fetched successfully'));
});

export const getStudentsByAssignment = asyncHandler(async (req: Request, res: Response) => {
  const students = await FacultyService.getStudentsByAssignment(req.params.assignmentId);
  res.status(200).json(new ApiResponse(200, students, 'Students fetched successfully'));
});

export const markAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { assignment_id, date, session, records } = req.body;
  if (!assignment_id || !date || !session || !records?.length) {
    throw new ApiError(400, 'assignment_id, date, session and records are required');
  }
  const attendance = await FacultyService.markAttendance({
    assignment_id,
    date,
    session,
    records,
    recorded_by: req.user!.id,
  });
  res.status(201).json(new ApiResponse(201, attendance, 'Attendance marked successfully'));
});

export const getAttendanceByAssignment = asyncHandler(async (req: Request, res: Response) => {
  const attendance = await FacultyService.getAttendanceByAssignment(req.params.assignmentId);
  res.status(200).json(new ApiResponse(200, attendance, 'Attendance fetched successfully'));
});

export const getAttendanceForDate = asyncHandler(async (req: Request, res: Response) => {
  const { date, session } = req.query;
  if (!date || !session) throw new ApiError(400, 'date and session are required');
  const records = await FacultyService.getAttendanceForDate(
    req.params.assignmentId,
    date as string,
    session as string
  );
  res.status(200).json(new ApiResponse(200, records, 'Attendance for date fetched'));
});

export const createMarkComponent = asyncHandler(async (req: Request, res: Response) => {
  const { assignment_id, name, max_marks, type } = req.body;
  if (!assignment_id || !name || !max_marks) {
    throw new ApiError(400, 'assignment_id, name, and max_marks are required');
  }
  const component = await FacultyService.createMarkComponent({ assignment_id, name, max_marks, type });
  res.status(201).json(new ApiResponse(201, component, 'Mark component created successfully'));
});

export const getMarkComponents = asyncHandler(async (req: Request, res: Response) => {
  const components = await FacultyService.getMarkComponents(req.params.assignmentId);
  res.status(200).json(new ApiResponse(200, components, 'Mark components fetched successfully'));
});

export const deleteMarkComponent = asyncHandler(async (req: Request, res: Response) => {
  await FacultyService.deleteMarkComponent(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Mark component deleted successfully'));
});

export const enterMarks = asyncHandler(async (req: Request, res: Response) => {
  if (!Array.isArray(req.body) || req.body.length === 0) {
    throw new ApiError(400, 'Request body must be a non-empty array of mark entries');
  }
  const marks = await FacultyService.enterMarks(req.body);
  res.status(201).json(new ApiResponse(201, marks, 'Marks entered successfully'));
});

export const getMarksByAssignment = asyncHandler(async (req: Request, res: Response) => {
  const marks = await FacultyService.getMarksByAssignment(req.params.assignmentId);
  res.status(200).json(new ApiResponse(200, marks, 'Marks fetched successfully'));
});

export const uploadMaterial = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ApiError(400, 'No file uploaded');
  }
  const { title, subject_id, department_id } = req.body;
  if (!title || !subject_id) {
    throw new ApiError(400, 'Title and subject_id are required');
  }
  const material = await FacultyService.uploadMaterial({
    title,
    filename: req.file.originalname,
    filepath: `/uploads/${req.file.filename}`,
    subject_id,
    uploaded_by: req.user!.id,
    department_id,
  });
  res.status(201).json(new ApiResponse(201, material, 'Material uploaded successfully'));
});

export const getMaterialsBySubject = asyncHandler(async (req: Request, res: Response) => {
  const materials = await FacultyService.getMaterialsBySubject(req.params.subjectId);
  res.status(200).json(new ApiResponse(200, materials, 'Materials fetched successfully'));
});

export const getAllSubjects = asyncHandler(async (req: Request, res: Response) => {
  const subjects = await FacultyService.getAllSubjects();
  res.status(200).json(new ApiResponse(200, subjects, 'Subjects fetched successfully'));
});
