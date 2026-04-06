import { Document, Types } from 'mongoose';

// User Types
export type UserRole = 'admin' | 'faculty' | 'student';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Department Types
export interface IDepartment extends Document {
  _id: Types.ObjectId;
  name: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
}

// Course Types
export interface ICourse extends Document {
  _id: Types.ObjectId;
  name: string;
  code: string;
  departmentId: Types.ObjectId;
  totalSemesters: number;
  createdAt: Date;
  updatedAt: Date;
}

// Subject Types
export interface ISubject extends Document {
  _id: Types.ObjectId;
  name: string;
  code: string;
  courseId: Types.ObjectId;
  semester: number;
  credits: number;
  createdAt: Date;
  updatedAt: Date;
}

// Student Types
export interface IStudent extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  departmentId: Types.ObjectId;
  courseId: Types.ObjectId;
  rollNumber: string;
  semester: number;
  section: string;
  academicYear: string;
  admissionDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Faculty Types
export interface IFaculty extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  departmentId: Types.ObjectId;
  employeeId: string;
  designation: string;
  specialization?: string;
  joiningDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Teaching Assignment Types
export interface ITeachingAssignment extends Document {
  _id: Types.ObjectId;
  facultyId: Types.ObjectId;
  subjectId: Types.ObjectId;
  departmentId: Types.ObjectId;
  courseId: Types.ObjectId;
  semester: number;
  section: string;
  academicYear: string;
  createdAt: Date;
  updatedAt: Date;
}

// Attendance Types
export type AttendanceStatus = 'present' | 'absent' | 'od' | 'medical_leave';

export interface IAttendance extends Document {
  _id: Types.ObjectId;
  assignmentId: Types.ObjectId;
  studentId: Types.ObjectId;
  date: Date;
  session: string;
  status: AttendanceStatus;
  recordedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Mark Component Types
export type MarkComponentType = 'internal' | 'assignment' | 'quiz' | 'project' | 'lab' | 'other';

export interface IMarkComponent extends Document {
  _id: Types.ObjectId;
  assignmentId: Types.ObjectId;
  name: string;
  maxMarks: number;
  type: MarkComponentType;
  createdAt: Date;
  updatedAt: Date;
}

// Marks Types
export interface IMark extends Document {
  _id: Types.ObjectId;
  componentId: Types.ObjectId;
  studentId: Types.ObjectId;
  marksObtained: number;
  remarks?: string;
  recordedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Material Types
export interface IMaterial extends Document {
  _id: Types.ObjectId;
  title: string;
  filename: string;
  filepath: string;
  subjectId: Types.ObjectId;
  uploadedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
