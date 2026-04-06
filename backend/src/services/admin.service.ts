import { User, IUser } from '../models/user.model';
import { Department, IDepartment } from '../models/department.model';
import { Course, ICourse } from '../models/course.model';
import { Subject, ISubject } from '../models/subject.model';
import { Student } from '../models/student.model';
import { Faculty } from '../models/faculty.model';
import { TeachingAssignment } from '../models/teachingAssignment.model';
import mongoose from 'mongoose';

export const AdminService = {
  async getAllUsers() {
    return User.find().select('-password').sort({ createdAt: -1 });
  },

  async getStudents() {
    return Student.find()
      .populate('user_id', 'name email phone is_active createdAt')
      .populate('department_id', 'name code')
      .populate('course_id', 'name code')
      .sort({ createdAt: -1 });
  },

  async getFacultyList() {
    return Faculty.find()
      .populate('user_id', 'name email phone is_active createdAt')
      .populate('department_id', 'name code')
      .sort({ createdAt: -1 });
  },

  async createUser(userData: Partial<IUser>) {
    return User.create(userData);
  },

  async getUserById(id: string) {
    return User.findById(id).select('-password');
  },

  async updateUser(id: string, updateData: Partial<IUser>) {
    return User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
  },

  async deleteUser(id: string) {
    return User.findByIdAndDelete(id);
  },

  async createStudent(userData: Partial<IUser>, studentData: any) {
    const session = await User.startSession();
    session.startTransaction();
    try {
      const user = await User.create([userData], { session });
      const student = await Student.create([{ ...studentData, user_id: user[0]._id }], { session });
      await session.commitTransaction();
      session.endSession();
      return { user: user[0], student: student[0] };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  },

  async createFaculty(userData: Partial<IUser>, facultyData: any) {
    const session = await User.startSession();
    session.startTransaction();
    try {
      const user = await User.create([userData], { session });
      const faculty = await Faculty.create([{ ...facultyData, user_id: user[0]._id }], { session });
      await session.commitTransaction();
      session.endSession();
      return { user: user[0], faculty: faculty[0] };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  },

  async getDepartments() {
    return Department.find().sort({ name: 1 });
  },

  async createDepartment(data: Partial<IDepartment>) {
    return Department.create(data);
  },

  async deleteDepartment(id: string) {
    return Department.findByIdAndDelete(id);
  },

  async getCourses(departmentId?: string) {
    const filter = departmentId ? { department_id: departmentId } : {};
    return Course.find(filter).populate('department_id', 'name code').sort({ name: 1 });
  },

  async createCourse(data: Partial<ICourse>) {
    return Course.create(data);
  },

  async getSubjects(courseId?: string) {
    const filter = courseId ? { course_id: courseId } : {};
    return Subject.find(filter)
      .populate({ path: 'course_id', select: 'name code', populate: { path: 'department_id', select: 'name code' } })
      .sort({ name: 1 });
  },

  async createSubject(data: Partial<ISubject>) {
    return Subject.create(data);
  },

  async getTeachingAssignments() {
    return TeachingAssignment.find()
      .populate('faculty_id', 'name email')
      .populate('subject_id', 'name code')
      .populate('department_id', 'name code')
      .populate('course_id', 'name code')
      .sort({ createdAt: -1 });
  },

  async createTeachingAssignment(data: any) {
    return TeachingAssignment.create(data);
  },

  async deleteTeachingAssignment(id: string) {
    return TeachingAssignment.findByIdAndDelete(id);
  },

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
};
