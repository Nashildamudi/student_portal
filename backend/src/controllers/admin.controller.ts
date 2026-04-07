import { Response } from 'express';
import { adminService } from '../services';
import { ApiResponse, asyncHandler } from '../utils';
import { AuthenticatedRequest } from '../types';

export const adminController = {
  // Dashboard Stats
  getStats: asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const stats = await adminService.getDashboardStats();
    res.json(ApiResponse.ok(stats, 'Stats fetched successfully'));
  }),

  // Department CRUD
  createDepartment: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const dept = await adminService.createDepartment(req.body);
    res.status(201).json(ApiResponse.created(dept, 'Department created successfully'));
  }),

  getDepartments: asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const departments = await adminService.getDepartments();
    res.json(ApiResponse.ok(departments, 'Departments fetched successfully'));
  }),

  getDepartmentById: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const dept = await adminService.getDepartmentById(req.params.id);
    res.json(ApiResponse.ok(dept, 'Department fetched successfully'));
  }),

  updateDepartment: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const dept = await adminService.updateDepartment(req.params.id, req.body);
    res.json(ApiResponse.ok(dept, 'Department updated successfully'));
  }),

  deleteDepartment: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await adminService.deleteDepartment(req.params.id);
    res.json(ApiResponse.noContent('Department deleted successfully'));
  }),

  // Course CRUD
  createCourse: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const course = await adminService.createCourse(req.body);
    res.status(201).json(ApiResponse.created(course, 'Course created successfully'));
  }),

  getCourses: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const departmentId = req.query.departmentId as string | undefined;
    const courses = await adminService.getCourses(departmentId);
    res.json(ApiResponse.ok(courses, 'Courses fetched successfully'));
  }),

  getCourseById: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const course = await adminService.getCourseById(req.params.id);
    res.json(ApiResponse.ok(course, 'Course fetched successfully'));
  }),

  updateCourse: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const course = await adminService.updateCourse(req.params.id, req.body);
    res.json(ApiResponse.ok(course, 'Course updated successfully'));
  }),

  deleteCourse: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await adminService.deleteCourse(req.params.id);
    res.json(ApiResponse.noContent('Course deleted successfully'));
  }),

  // Subject CRUD
  createSubject: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const subject = await adminService.createSubject(req.body);
    res.status(201).json(ApiResponse.created(subject, 'Subject created successfully'));
  }),

  getSubjects: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const courseId = req.query.courseId as string | undefined;
    const semester = req.query.semester ? parseInt(req.query.semester as string) : undefined;
    const subjects = await adminService.getSubjects(courseId, semester);
    res.json(ApiResponse.ok(subjects, 'Subjects fetched successfully'));
  }),

  getSubjectById: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const subject = await adminService.getSubjectById(req.params.id);
    res.json(ApiResponse.ok(subject, 'Subject fetched successfully'));
  }),

  updateSubject: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const subject = await adminService.updateSubject(req.params.id, req.body);
    res.json(ApiResponse.ok(subject, 'Subject updated successfully'));
  }),

  deleteSubject: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await adminService.deleteSubject(req.params.id);
    res.json(ApiResponse.noContent('Subject deleted successfully'));
  }),

  // Student CRUD
  registerStudent: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await adminService.registerStudent(req.body);
    res.status(201).json(ApiResponse.created(result, 'Student registered successfully'));
  }),

  getStudents: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const filters = {
      courseId: req.query.courseId as string | undefined,
      semester: req.query.semester ? parseInt(req.query.semester as string) : undefined,
      section: req.query.section as string | undefined,
    };
    const students = await adminService.getStudents(filters);
    res.json(ApiResponse.ok(students, 'Students fetched successfully'));
  }),

  getStudentById: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const student = await adminService.getStudentById(req.params.id);
    res.json(ApiResponse.ok(student, 'Student fetched successfully'));
  }),

  updateStudent: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const student = await adminService.updateStudent(req.params.id, req.body);
    res.json(ApiResponse.ok(student, 'Student updated successfully'));
  }),

  deleteStudent: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await adminService.deleteStudent(req.params.id);
    res.json(ApiResponse.noContent('Student deleted successfully'));
  }),

  // Faculty CRUD
  registerFaculty: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await adminService.registerFaculty(req.body);
    res.status(201).json(ApiResponse.created(result, 'Faculty registered successfully'));
  }),

  getFacultyList: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const departmentId = req.query.departmentId as string | undefined;
    const faculty = await adminService.getFacultyList(departmentId);
    res.json(ApiResponse.ok(faculty, 'Faculty list fetched successfully'));
  }),

  getFacultyById: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const faculty = await adminService.getFacultyById(req.params.id);
    res.json(ApiResponse.ok(faculty, 'Faculty fetched successfully'));
  }),

  updateFaculty: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const faculty = await adminService.updateFaculty(req.params.id, req.body);
    res.json(ApiResponse.ok(faculty, 'Faculty updated successfully'));
  }),

  deleteFaculty: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await adminService.deleteFaculty(req.params.id);
    res.json(ApiResponse.noContent('Faculty deleted successfully'));
  }),

  // Teaching Assignment CRUD
  createTeachingAssignment: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const assignment = await adminService.createTeachingAssignment(req.body);
    res.status(201).json(ApiResponse.created(assignment, 'Teaching assignment created successfully'));
  }),

  getTeachingAssignments: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const filters = {
      facultyId: req.query.facultyId as string | undefined,
      courseId: req.query.courseId as string | undefined,
      semester: req.query.semester ? parseInt(req.query.semester as string) : undefined,
      academicYear: req.query.academicYear as string | undefined,
    };
    const assignments = await adminService.getTeachingAssignments(filters);
    res.json(ApiResponse.ok(assignments, 'Teaching assignments fetched successfully'));
  }),

  getTeachingAssignmentById: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const assignment = await adminService.getTeachingAssignmentById(req.params.id);
    res.json(ApiResponse.ok(assignment, 'Teaching assignment fetched successfully'));
  }),

  deleteTeachingAssignment: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await adminService.deleteTeachingAssignment(req.params.id);
    res.json(ApiResponse.noContent('Teaching assignment deleted successfully'));
  }),

  // Users
  getUsers: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const role = req.query.role as string | undefined;
    const users = await adminService.getUsers(role);
    res.json(ApiResponse.ok(users, 'Users fetched successfully'));
  }),

  toggleUserStatus: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await adminService.toggleUserStatus(req.params.id);
    res.json(ApiResponse.ok(user, 'User status updated successfully'));
  }),
};
