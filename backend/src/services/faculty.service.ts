import { Types } from 'mongoose';
import {
  TeachingAssignment,
  Student,
  Attendance,
  MarkComponent,
  Mark,
  Material,
  Subject,
} from '../models';
import { ApiError } from '../utils';
import { AttendanceStatus, MarkComponentType } from '../types';

export const facultyService = {
  // Get faculty's teaching assignments
  async getMyAssignments(facultyId: string) {
    return TeachingAssignment.find({ facultyId })
      .populate('subjectId', 'name code credits')
      .populate('departmentId', 'name code')
      .populate('courseId', 'name code')
      .sort({ academicYear: -1, semester: 1 });
  },

  // Get students for an assignment
  async getStudentsForAssignment(assignmentId: string, facultyId: string) {
    // Verify assignment belongs to faculty
    const assignment = await TeachingAssignment.findOne({
      _id: assignmentId,
      facultyId,
    });
    if (!assignment) throw ApiError.notFound('Assignment not found or unauthorized');

    const students = await Student.find({
      courseId: assignment.courseId,
      semester: assignment.semester,
      section: assignment.section,
    })
      .populate('userId', 'name email')
      .sort({ rollNumber: 1 });

    return students;
  },

  // Attendance Operations
  async markAttendance(
    assignmentId: string,
    facultyId: string,
    date: Date,
    session: string,
    records: Array<{ studentId: string; status: AttendanceStatus }>
  ) {
    // Verify assignment belongs to faculty
    const assignment = await TeachingAssignment.findOne({
      _id: assignmentId,
      facultyId,
    });
    if (!assignment) throw ApiError.notFound('Assignment not found or unauthorized');

    // Check if attendance already exists for this date/session
    const existingAttendance = await Attendance.findOne({
      assignmentId,
      date,
      session,
    });
    if (existingAttendance) {
      throw ApiError.conflict('Attendance already marked for this date and session');
    }

    // Create attendance records
    const attendanceRecords = records.map((record) => ({
      assignmentId: new Types.ObjectId(assignmentId),
      studentId: new Types.ObjectId(record.studentId),
      date,
      session,
      status: record.status,
      recordedBy: new Types.ObjectId(facultyId),
    }));

    await Attendance.insertMany(attendanceRecords);

    return { message: 'Attendance marked successfully', count: records.length };
  },

  async getAttendanceForDate(assignmentId: string, facultyId: string, date: Date, session: string) {
    const assignment = await TeachingAssignment.findOne({
      _id: assignmentId,
      facultyId,
    });
    if (!assignment) throw ApiError.notFound('Assignment not found or unauthorized');

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return Attendance.find({
      assignmentId,
      session,
      date: { $gte: startOfDay, $lte: endOfDay },
    }).populate({
      path: 'studentId',
      populate: { path: 'userId', select: 'name email' },
    });
  },

  async getAttendanceSummary(assignmentId: string, facultyId: string) {
    const assignment = await TeachingAssignment.findOne({
      _id: assignmentId,
      facultyId,
    }).populate('subjectId', 'name code');
    if (!assignment) throw ApiError.notFound('Assignment not found or unauthorized');

    // Get all students
    const students = await Student.find({
      courseId: assignment.courseId,
      semester: assignment.semester,
      section: assignment.section,
    }).populate('userId', 'name email');

    // Get attendance summary for each student
    const summaryPromises = students.map(async (student) => {
      const attendance = await Attendance.find({
        assignmentId,
        studentId: student._id,
      });

      const total = attendance.length;
      const present = attendance.filter(
        (a) => a.status === 'present' || a.status === 'od'
      ).length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

      return {
        student: {
          _id: student._id,
          rollNumber: student.rollNumber,
          name: (student.userId as unknown as { name: string })?.name || 'Unknown',
          email: (student.userId as unknown as { email: string })?.email || '',
        },
        total,
        present,
        absent: total - present,
        percentage,
      };
    });

    const summary = await Promise.all(summaryPromises);
    return { assignment, summary };
  },

  // Mark Component Operations
  async createMarkComponent(
    assignmentId: string,
    facultyId: string,
    data: { name: string; maxMarks: number; type: MarkComponentType }
  ) {
    const assignment = await TeachingAssignment.findOne({
      _id: assignmentId,
      facultyId,
    });
    if (!assignment) throw ApiError.notFound('Assignment not found or unauthorized');

    return MarkComponent.create({
      assignmentId,
      ...data,
    });
  },

  async getMarkComponents(assignmentId: string, facultyId: string) {
    const assignment = await TeachingAssignment.findOne({
      _id: assignmentId,
      facultyId,
    });
    if (!assignment) throw ApiError.notFound('Assignment not found or unauthorized');

    return MarkComponent.find({ assignmentId }).sort({ createdAt: 1 });
  },

  async deleteMarkComponent(componentId: string, facultyId: string) {
    const component = await MarkComponent.findById(componentId);
    if (!component) throw ApiError.notFound('Component not found');

    const assignment = await TeachingAssignment.findOne({
      _id: component.assignmentId,
      facultyId,
    });
    if (!assignment) throw ApiError.forbidden('Not authorized to delete this component');

    // Delete all marks for this component
    await Mark.deleteMany({ componentId });
    await MarkComponent.findByIdAndDelete(componentId);

    return { message: 'Component and associated marks deleted' };
  },

  // Marks Operations
  async enterMarks(
    facultyId: string,
    entries: Array<{ componentId: string; studentId: string; marksObtained: number; remarks?: string }>
  ) {
    // Validate all components belong to faculty
    const componentIds = [...new Set(entries.map((e) => e.componentId))];
    const components = await MarkComponent.find({ _id: { $in: componentIds } });

    for (const component of components) {
      const assignment = await TeachingAssignment.findOne({
        _id: component.assignmentId,
        facultyId,
      });
      if (!assignment) {
        throw ApiError.forbidden('Not authorized to enter marks for some components');
      }

      // Validate marks don't exceed max
      const entriesForComponent = entries.filter((e) => e.componentId === component._id.toString());
      for (const entry of entriesForComponent) {
        if (entry.marksObtained > component.maxMarks) {
          throw ApiError.badRequest(`Marks cannot exceed ${component.maxMarks} for ${component.name}`);
        }
      }
    }

    // Upsert marks
    const operations = entries.map((entry) => ({
      updateOne: {
        filter: { componentId: entry.componentId, studentId: entry.studentId },
        update: {
          $set: {
            marksObtained: entry.marksObtained,
            remarks: entry.remarks || '',
            recordedBy: facultyId,
          },
        },
        upsert: true,
      },
    }));

    await Mark.bulkWrite(operations);

    return { message: 'Marks saved successfully', count: entries.length };
  },

  async getMarksForAssignment(assignmentId: string, facultyId: string) {
    const assignment = await TeachingAssignment.findOne({
      _id: assignmentId,
      facultyId,
    });
    if (!assignment) throw ApiError.notFound('Assignment not found or unauthorized');

    const components = await MarkComponent.find({ assignmentId });
    const componentIds = components.map((c) => c._id);

    const marks = await Mark.find({ componentId: { $in: componentIds } })
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'name email' },
      })
      .populate('componentId', 'name maxMarks type');

    return { components, marks };
  },

  // Materials Operations
  async uploadMaterial(
    facultyId: string,
    data: { title: string; filename: string; filepath: string; subjectId: string }
  ) {
    // Verify faculty teaches this subject
    const assignment = await TeachingAssignment.findOne({
      facultyId,
      subjectId: data.subjectId,
    });
    if (!assignment) {
      throw ApiError.forbidden('You can only upload materials for subjects you teach');
    }

    return Material.create({
      ...data,
      uploadedBy: facultyId,
    });
  },

  async getMaterials(subjectId: string) {
    return Material.find({ subjectId })
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });
  },

  async deleteMaterial(materialId: string, facultyId: string) {
    const material = await Material.findById(materialId);
    if (!material) throw ApiError.notFound('Material not found');

    if (material.uploadedBy.toString() !== facultyId) {
      throw ApiError.forbidden('Not authorized to delete this material');
    }

    await Material.findByIdAndDelete(materialId);
    return { message: 'Material deleted successfully' };
  },

  // Get subjects that faculty teaches
  async getMySubjects(facultyId: string) {
    const assignments = await TeachingAssignment.find({ facultyId }).distinct('subjectId');
    return Subject.find({ _id: { $in: assignments } })
      .populate('courseId', 'name code')
      .sort({ name: 1 });
  },
};
