export type UserRole = 'admin' | 'faculty' | 'student';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  _id: string;
  name: string;
  code: string;
}

export interface Course {
  _id: string;
  name: string;
  code: string;
  departmentId: string;
  department?: Department;
  totalSemesters: number;
}

export interface Subject {
  _id: string;
  name: string;
  code: string;
  courseId: string;
  course?: Course;
  semester: number;
  credits: number;
}

export interface Student {
  _id: string;
  userId: string;
  user?: User;
  departmentId: string;
  department?: Department;
  courseId: string;
  course?: Course;
  rollNumber: string;
  semester: number;
  section: string;
  academicYear: string;
  admissionDate: string;
}

export interface Faculty {
  _id: string;
  userId: string;
  user?: User;
  departmentId: string;
  department?: Department;
  employeeId: string;
  designation: string;
  specialization?: string;
  joiningDate: string;
}

export interface TeachingAssignment {
  _id: string;
  facultyId: string;
  faculty?: User;
  subjectId: string;
  subject?: Subject;
  departmentId: string;
  department?: Department;
  courseId: string;
  course?: Course;
  semester: number;
  section: string;
  academicYear: string;
}

export interface AttendanceRecord {
  _id: string;
  assignmentId: string;
  studentId: string;
  date: string;
  session: string;
  status: 'present' | 'absent' | 'od' | 'medical_leave';
}

export interface AttendanceSummary {
  student: { _id: string; rollNumber: string; name: string };
  total: number;
  present: number;
  absent: number;
  percentage: number;
}

export interface MarkComponent {
  _id: string;
  assignmentId: string;
  name: string;
  maxMarks: number;
  type: 'internal' | 'assignment' | 'quiz' | 'project' | 'lab' | 'other';
}

export interface Mark {
  _id: string;
  componentId: string;
  studentId: string;
  student?: { _id: string; rollNumber: string; name: string };
  marksObtained: number;
  remarks?: string;
}

export interface Material {
  _id: string;
  title: string;
  filename: string;
  filepath: string;
  subjectId: string;
  subject?: Subject;
  uploadedBy: string;
  uploader?: { name: string };
  createdAt: string;
}

export interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  data: T;
  message: string;
}

export interface DashboardStats {
  students: number;
  faculty: number;
  departments: number;
  courses: number;
  subjects: number;
  assignments: number;
}
