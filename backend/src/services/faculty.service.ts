import { TeachingAssignment } from '../models/teachingAssignment.model';
import { Attendance } from '../models/attendance.model';
import { MarkComponent } from '../models/markComponent.model';
import { Mark } from '../models/mark.model';
import { Material } from '../models/material.model';
import { Subject } from '../models/subject.model';
import { Student } from '../models/student.model';
import mongoose from 'mongoose';

export const FacultyService = {
  async getAssignments(facultyUserId: string) {
    // faculty_id on the assignment is the User._id (auth user), not Faculty._id
    return TeachingAssignment.find({ faculty_id: facultyUserId })
      .populate('subject_id', 'name code semester')
      .populate('department_id', 'name code')
      .populate('course_id', 'name code')
      .sort({ createdAt: -1 });
  },

  async getStudentsByAssignment(assignmentId: string) {
    const assignment = await TeachingAssignment.findById(assignmentId);
    if (!assignment) return [];

    const { course_id, semester, section } = assignment;

    // Find Student docs that match this course+semester+section
    const students = await Student.find({
      course_id,
      semester,
      section,
    }).populate('user_id', 'name email');

    // Return in a flat format for the frontend
    return students.map((s: any) => ({
      _id: s._id,
      user_id: s.user_id?._id,
      name: s.user_id?.name || 'Unknown',
      email: s.user_id?.email || '',
      roll_number: s.roll_number,
      semester: s.semester,
      section: s.section,
    }));
  },

  async markAttendance(data: {
    assignment_id: string;
    date: string;
    session: string;
    records: Array<{ student_id: string; status: 'present' | 'absent' | 'od' | 'medical_leave' }>;
    recorded_by?: string;
  }) {
    const { assignment_id, date, session, records, recorded_by } = data;
    const docs = records.map((r) => ({
      assignment_id,
      student_id: r.student_id,
      date: new Date(date),
      session,
      status: r.status,
      recorded_by,
    }));
    // Use insertMany with ordered:false so duplicate key errors don't stop the batch
    return Attendance.insertMany(docs, { ordered: false });
  },

  async getAttendanceByAssignment(assignmentId: string) {
    return Attendance.find({ assignment_id: assignmentId })
      .populate('student_id', 'name email roll_number');
  },

  async getAttendanceForDate(assignmentId: string, date: string, session: string) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return Attendance.find({
      assignment_id: assignmentId,
      session,
      date: { $gte: start, $lte: end },
    }).populate('student_id', 'name email');
  },

  async createMarkComponent(data: any) {
    return MarkComponent.create(data);
  },

  async getMarkComponents(assignmentId: string) {
    return MarkComponent.find({ assignment_id: assignmentId }).sort({ createdAt: 1 });
  },

  async deleteMarkComponent(id: string) {
    return MarkComponent.findByIdAndDelete(id);
  },

  async enterMarks(data: Array<{ student_id: string; component_id: string; marks_obtained: number; assignment_id: string }>) {
    const ops = data.map((d) => ({
      updateOne: {
        filter: { student_id: d.student_id, component_id: d.component_id },
        update: { $set: { marks_obtained: d.marks_obtained, assignment_id: d.assignment_id } },
        upsert: true,
      },
    }));
    return Mark.bulkWrite(ops);
  },

  async getMarksByAssignment(assignmentId: string) {
    // Get all components for this assignment, then get marks for those components
    const components = await MarkComponent.find({ assignment_id: assignmentId });
    const componentIds = components.map((c) => c._id);
    return Mark.find({ component_id: { $in: componentIds } })
      .populate('student_id', 'name email')
      .populate('component_id', 'name max_marks type');
  },

  async uploadMaterial(data: {
    title: string;
    filename: string;
    filepath: string;
    subject_id: string;
    uploaded_by: string;
    department_id?: string;
  }) {
    return Material.create(data);
  },

  async getMaterialsBySubject(subjectId: string) {
    return Material.find({ subject_id: subjectId })
      .populate('uploaded_by', 'name')
      .sort({ createdAt: -1 });
  },

  async getAllSubjects() {
    return Subject.find().populate('course_id', 'name');
  },
};
