import mongoose from 'mongoose';
import {
  User,
  Department,
  Course,
  Subject,
  Student,
  Faculty,
  TeachingAssignment,
} from '../models';
import { ApiError } from '../utils';

// Department Operations
export const adminService = {
  // Stats
  async getDashboardStats() {
    const [students, faculty, departments, courses, subjects, assignments] = await Promise.all([
      Student.countDocuments(),
      Faculty.countDocuments(),
      Department.countDocuments(),
      Course.countDocuments(),
      Subject.countDocuments(),
      TeachingAssignment.countDocuments(),
    ]);

    return { students, faculty, departments, courses, subjects, assignments };
  },

  // Department CRUD
  async createDepartment(data: { name: string; code: string }) {
    const existing = await Department.findOne({ code: data.code.toUpperCase() });
    if (existing) {
      throw ApiError.conflict('Department code already exists');
    }
    return Department.create(data);
  },

  async getDepartments() {
    return Department.find().sort({ name: 1 });
  },

  async getDepartmentById(id: string) {
    const dept = await Department.findById(id);
    if (!dept) throw ApiError.notFound('Department not found');
    return dept;
  },

  async updateDepartment(id: string, data: { name?: string; code?: string }) {
    const dept = await Department.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!dept) throw ApiError.notFound('Department not found');
    return dept;
  },

  async deleteDepartment(id: string) {
    // Check if department has courses
    const courseCount = await Course.countDocuments({ departmentId: id });
    if (courseCount > 0) {
      throw ApiError.badRequest('Cannot delete department with existing courses');
    }
    const dept = await Department.findByIdAndDelete(id);
    if (!dept) throw ApiError.notFound('Department not found');
    return dept;
  },

  // Course CRUD
  async createCourse(data: { name: string; code: string; departmentId: string; totalSemesters?: number }) {
    const existing = await Course.findOne({ code: data.code.toUpperCase() });
    if (existing) {
      throw ApiError.conflict('Course code already exists');
    }
    const dept = await Department.findById(data.departmentId);
    if (!dept) throw ApiError.notFound('Department not found');
    return Course.create(data);
  },

  async getCourses(departmentId?: string) {
    const query = departmentId ? { departmentId } : {};
    return Course.find(query).populate('departmentId', 'name code').sort({ name: 1 });
  },

  async getCourseById(id: string) {
    const course = await Course.findById(id).populate('departmentId', 'name code');
    if (!course) throw ApiError.notFound('Course not found');
    return course;
  },

  async updateCourse(id: string, data: { name?: string; code?: string; departmentId?: string; totalSemesters?: number }) {
    const course = await Course.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!course) throw ApiError.notFound('Course not found');
    return course;
  },

  async deleteCourse(id: string) {
    const subjectCount = await Subject.countDocuments({ courseId: id });
    if (subjectCount > 0) {
      throw ApiError.badRequest('Cannot delete course with existing subjects');
    }
    const course = await Course.findByIdAndDelete(id);
    if (!course) throw ApiError.notFound('Course not found');
    return course;
  },

  // Subject CRUD
  async createSubject(data: { name: string; code: string; courseId: string; semester: number; credits?: number }) {
    const course = await Course.findById(data.courseId);
    if (!course) throw ApiError.notFound('Course not found');
    if (data.semester > course.totalSemesters) {
      throw ApiError.badRequest(`Semester cannot exceed ${course.totalSemesters}`);
    }
    return Subject.create(data);
  },

  async getSubjects(courseId?: string, semester?: number) {
    const query: Record<string, unknown> = {};
    if (courseId) query.courseId = courseId;
    if (semester) query.semester = semester;
    return Subject.find(query).populate('courseId', 'name code').sort({ semester: 1, name: 1 });
  },

  async getSubjectById(id: string) {
    const subject = await Subject.findById(id).populate('courseId', 'name code');
    if (!subject) throw ApiError.notFound('Subject not found');
    return subject;
  },

  async updateSubject(id: string, data: { name?: string; code?: string; courseId?: string; semester?: number; credits?: number }) {
    const subject = await Subject.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!subject) throw ApiError.notFound('Subject not found');
    return subject;
  },

  async deleteSubject(id: string) {
    const assignmentCount = await TeachingAssignment.countDocuments({ subjectId: id });
    if (assignmentCount > 0) {
      throw ApiError.badRequest('Cannot delete subject with existing teaching assignments');
    }
    const subject = await Subject.findByIdAndDelete(id);
    if (!subject) throw ApiError.notFound('Subject not found');
    return subject;
  },

  // Student Registration (with transaction)
  async registerStudent(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    departmentId: string;
    courseId: string;
    rollNumber: string;
    semester: number;
    section: string;
    academicYear: string;
  }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Check if email exists
      const existingUser = await User.findOne({ email: data.email.toLowerCase() });
      if (existingUser) {
        throw ApiError.conflict('Email already registered');
      }

      // Check if roll number exists
      const existingStudent = await Student.findOne({ rollNumber: data.rollNumber.toUpperCase() });
      if (existingStudent) {
        throw ApiError.conflict('Roll number already exists');
      }

      // Create user
      const [user] = await User.create(
        [{
          name: data.name,
          email: data.email.toLowerCase(),
          password: data.password,
          phone: data.phone,
          role: 'student',
        }],
        { session }
      );

      // Create student record
      const [student] = await Student.create(
        [{
          userId: user._id,
          departmentId: data.departmentId,
          courseId: data.courseId,
          rollNumber: data.rollNumber.toUpperCase(),
          semester: data.semester,
          section: data.section.toUpperCase(),
          academicYear: data.academicYear,
        }],
        { session }
      );

      await session.commitTransaction();

      return {
        user: user.toJSON(),
        student: student.toJSON(),
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  async getStudents(filters?: { courseId?: string; semester?: number; section?: string }) {
    const query: Record<string, unknown> = {};
    if (filters?.courseId) query.courseId = filters.courseId;
    if (filters?.semester) query.semester = filters.semester;
    if (filters?.section) query.section = filters.section.toUpperCase();

    return Student.find(query)
      .populate('userId', 'name email phone isActive')
      .populate('departmentId', 'name code')
      .populate('courseId', 'name code')
      .sort({ rollNumber: 1 });
  },

  async getStudentById(id: string) {
    const student = await Student.findById(id)
      .populate('userId', 'name email phone isActive')
      .populate('departmentId', 'name code')
      .populate('courseId', 'name code');
    if (!student) throw ApiError.notFound('Student not found');
    return student;
  },

  async updateStudent(id: string, data: {
    name?: string;
    phone?: string;
    departmentId?: string;
    courseId?: string;
    semester?: number;
    section?: string;
    academicYear?: string;
  }) {
    const student = await Student.findById(id);
    if (!student) throw ApiError.notFound('Student not found');

    // Update user info if provided
    if (data.name || data.phone) {
      await User.findByIdAndUpdate(student.userId, {
        ...(data.name && { name: data.name }),
        ...(data.phone && { phone: data.phone }),
      });
    }

    // Update student info
    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      {
        ...(data.departmentId && { departmentId: data.departmentId }),
        ...(data.courseId && { courseId: data.courseId }),
        ...(data.semester && { semester: data.semester }),
        ...(data.section && { section: data.section.toUpperCase() }),
        ...(data.academicYear && { academicYear: data.academicYear }),
      },
      { new: true, runValidators: true }
    )
      .populate('userId', 'name email phone isActive')
      .populate('departmentId', 'name code')
      .populate('courseId', 'name code');

    return updatedStudent;
  },

  async deleteStudent(id: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const student = await Student.findById(id);
      if (!student) throw ApiError.notFound('Student not found');

      await Student.findByIdAndDelete(id, { session });
      await User.findByIdAndDelete(student.userId, { session });

      await session.commitTransaction();
      return { message: 'Student deleted successfully' };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  // Faculty Registration (with transaction)
  async registerFaculty(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    departmentId: string;
    employeeId: string;
    designation: string;
    specialization?: string;
  }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Check if email exists
      const existingUser = await User.findOne({ email: data.email.toLowerCase() });
      if (existingUser) {
        throw ApiError.conflict('Email already registered');
      }

      // Check if employee ID exists
      const existingFaculty = await Faculty.findOne({ employeeId: data.employeeId.toUpperCase() });
      if (existingFaculty) {
        throw ApiError.conflict('Employee ID already exists');
      }

      // Create user
      const [user] = await User.create(
        [{
          name: data.name,
          email: data.email.toLowerCase(),
          password: data.password,
          phone: data.phone,
          role: 'faculty',
        }],
        { session }
      );

      // Create faculty record
      const [faculty] = await Faculty.create(
        [{
          userId: user._id,
          departmentId: data.departmentId,
          employeeId: data.employeeId.toUpperCase(),
          designation: data.designation,
          specialization: data.specialization,
        }],
        { session }
      );

      await session.commitTransaction();

      return {
        user: user.toJSON(),
        faculty: faculty.toJSON(),
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  async getFacultyList(departmentId?: string) {
    const query = departmentId ? { departmentId } : {};
    return Faculty.find(query)
      .populate('userId', 'name email phone isActive')
      .populate('departmentId', 'name code')
      .sort({ employeeId: 1 });
  },

  async getFacultyById(id: string) {
    const faculty = await Faculty.findById(id)
      .populate('userId', 'name email phone isActive')
      .populate('departmentId', 'name code');
    if (!faculty) throw ApiError.notFound('Faculty not found');
    return faculty;
  },

  async updateFaculty(id: string, data: {
    name?: string;
    phone?: string;
    departmentId?: string;
    designation?: string;
    specialization?: string;
  }) {
    const faculty = await Faculty.findById(id);
    if (!faculty) throw ApiError.notFound('Faculty not found');

    // Update user info if provided
    if (data.name || data.phone) {
      await User.findByIdAndUpdate(faculty.userId, {
        ...(data.name && { name: data.name }),
        ...(data.phone && { phone: data.phone }),
      });
    }

    // Update faculty info
    const updatedFaculty = await Faculty.findByIdAndUpdate(
      id,
      {
        ...(data.departmentId && { departmentId: data.departmentId }),
        ...(data.designation && { designation: data.designation }),
        ...(data.specialization !== undefined && { specialization: data.specialization }),
      },
      { new: true, runValidators: true }
    )
      .populate('userId', 'name email phone isActive')
      .populate('departmentId', 'name code');

    return updatedFaculty;
  },

  async deleteFaculty(id: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const faculty = await Faculty.findById(id);
      if (!faculty) throw ApiError.notFound('Faculty not found');

      // Check if faculty has assignments
      const assignmentCount = await TeachingAssignment.countDocuments({ facultyId: faculty.userId });
      if (assignmentCount > 0) {
        throw ApiError.badRequest('Cannot delete faculty with existing teaching assignments');
      }

      await Faculty.findByIdAndDelete(id, { session });
      await User.findByIdAndDelete(faculty.userId, { session });

      await session.commitTransaction();
      return { message: 'Faculty deleted successfully' };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  // Teaching Assignment CRUD
  async createTeachingAssignment(data: {
    facultyId: string;
    subjectId: string;
    departmentId: string;
    courseId: string;
    semester: number;
    section: string;
    academicYear: string;
  }) {
    // Verify faculty exists and is faculty role
    const faculty = await User.findOne({ _id: data.facultyId, role: 'faculty' });
    if (!faculty) throw ApiError.notFound('Faculty not found');

    // Verify subject exists
    const subject = await Subject.findById(data.subjectId);
    if (!subject) throw ApiError.notFound('Subject not found');

    return TeachingAssignment.create({
      ...data,
      section: data.section.toUpperCase(),
    });
  },

  async getTeachingAssignments(filters?: { facultyId?: string; courseId?: string; semester?: number; academicYear?: string }) {
    const query: Record<string, unknown> = {};
    if (filters?.facultyId) query.facultyId = filters.facultyId;
    if (filters?.courseId) query.courseId = filters.courseId;
    if (filters?.semester) query.semester = filters.semester;
    if (filters?.academicYear) query.academicYear = filters.academicYear;

    return TeachingAssignment.find(query)
      .populate('facultyId', 'name email')
      .populate('subjectId', 'name code')
      .populate('departmentId', 'name code')
      .populate('courseId', 'name code')
      .sort({ academicYear: -1, semester: 1 });
  },

  async getTeachingAssignmentById(id: string) {
    const assignment = await TeachingAssignment.findById(id)
      .populate('facultyId', 'name email')
      .populate('subjectId', 'name code')
      .populate('departmentId', 'name code')
      .populate('courseId', 'name code');
    if (!assignment) throw ApiError.notFound('Teaching assignment not found');
    return assignment;
  },

  async deleteTeachingAssignment(id: string) {
    const assignment = await TeachingAssignment.findByIdAndDelete(id);
    if (!assignment) throw ApiError.notFound('Teaching assignment not found');
    return assignment;
  },

  // Users management
  async getUsers(role?: string) {
    const query = role ? { role } : {};
    return User.find(query).select('-password').sort({ createdAt: -1 });
  },

  async toggleUserStatus(id: string) {
    const user = await User.findById(id);
    if (!user) throw ApiError.notFound('User not found');
    user.isActive = !user.isActive;
    await user.save();
    return user;
  },
};
