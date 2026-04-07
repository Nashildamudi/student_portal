import { Response } from 'express';
import { facultyService } from '../services';
import { ApiResponse, asyncHandler } from '../utils';
import { AuthenticatedRequest } from '../types';

export const facultyController = {
  // Assignments
  getMyAssignments: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const assignments = await facultyService.getMyAssignments(req.user!._id.toString());
    res.json(ApiResponse.ok(assignments, 'Assignments fetched successfully'));
  }),

  getStudentsForAssignment: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const students = await facultyService.getStudentsForAssignment(
      req.params.assignmentId,
      req.user!._id.toString()
    );
    res.json(ApiResponse.ok(students, 'Students fetched successfully'));
  }),

  // Attendance
  markAttendance: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { assignmentId, date, session, records } = req.body;
    const result = await facultyService.markAttendance(
      assignmentId,
      req.user!._id.toString(),
      new Date(date),
      session,
      records
    );
    res.status(201).json(ApiResponse.created(result, 'Attendance marked successfully'));
  }),

  getAttendanceForDate: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { assignmentId } = req.params;
    const { date, session } = req.query;
    const attendance = await facultyService.getAttendanceForDate(
      assignmentId,
      req.user!._id.toString(),
      new Date(date as string),
      session as string
    );
    res.json(ApiResponse.ok(attendance, 'Attendance fetched successfully'));
  }),

  getAttendanceSummary: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const summary = await facultyService.getAttendanceSummary(
      req.params.assignmentId,
      req.user!._id.toString()
    );
    res.json(ApiResponse.ok(summary, 'Attendance summary fetched successfully'));
  }),

  // Mark Components
  createMarkComponent: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const component = await facultyService.createMarkComponent(
      req.body.assignmentId,
      req.user!._id.toString(),
      req.body
    );
    res.status(201).json(ApiResponse.created(component, 'Mark component created successfully'));
  }),

  getMarkComponents: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const components = await facultyService.getMarkComponents(
      req.params.assignmentId,
      req.user!._id.toString()
    );
    res.json(ApiResponse.ok(components, 'Mark components fetched successfully'));
  }),

  deleteMarkComponent: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await facultyService.deleteMarkComponent(req.params.componentId, req.user!._id.toString());
    res.json(ApiResponse.noContent('Mark component deleted successfully'));
  }),

  // Marks
  enterMarks: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await facultyService.enterMarks(req.user!._id.toString(), req.body.entries);
    res.status(201).json(ApiResponse.created(result, 'Marks saved successfully'));
  }),

  getMarksForAssignment: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const marks = await facultyService.getMarksForAssignment(
      req.params.assignmentId,
      req.user!._id.toString()
    );
    res.json(ApiResponse.ok(marks, 'Marks fetched successfully'));
  }),

  // Materials
  uploadMaterial: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const material = await facultyService.uploadMaterial(req.user!._id.toString(), {
      title: req.body.title,
      filename: file.originalname,
      filepath: `/uploads/${file.filename}`,
      subjectId: req.body.subjectId,
    });
    res.status(201).json(ApiResponse.created(material, 'Material uploaded successfully'));
  }),

  getMaterials: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const materials = await facultyService.getMaterials(req.params.subjectId);
    res.json(ApiResponse.ok(materials, 'Materials fetched successfully'));
  }),

  deleteMaterial: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await facultyService.deleteMaterial(req.params.materialId, req.user!._id.toString());
    res.json(ApiResponse.noContent('Material deleted successfully'));
  }),

  getMySubjects: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const subjects = await facultyService.getMySubjects(req.user!._id.toString());
    res.json(ApiResponse.ok(subjects, 'Subjects fetched successfully'));
  }),
};
