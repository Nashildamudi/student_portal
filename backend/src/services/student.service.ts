import { Attendance } from '../models/attendance.model';
import { Mark } from '../models/mark.model';
import { Material } from '../models/material.model';
import { MarkComponent } from '../models/markComponent.model';
import { TeachingAssignment } from '../models/teachingAssignment.model';
import { Student } from '../models/student.model';

export const StudentService = {
  async getProfile(userId: string) {
    return Student.findOne({ user_id: userId })
      .populate('user_id', 'name email phone gender is_active createdAt')
      .populate('department_id', 'name code')
      .populate('course_id', 'name code');
  },

  async getAttendance(userId: string) {
    // Find this student's Student doc first
    const studentDoc = await Student.findOne({ user_id: userId });
    if (!studentDoc) return { records: [], summary: [] };

    const records = await Attendance.find({ student_id: studentDoc._id })
      .populate({
        path: 'assignment_id',
        populate: { path: 'subject_id', select: 'name code' },
      })
      .sort({ date: -1 });

    // Calculate per-subject attendance summary
    const subjectMap: Record<string, { subject: any; total: number; present: number }> = {};
    for (const rec of records) {
      const assignment = rec.assignment_id as any;
      const subject = assignment?.subject_id;
      if (!subject) continue;
      const key = subject._id.toString();
      if (!subjectMap[key]) {
        subjectMap[key] = { subject, total: 0, present: 0 };
      }
      subjectMap[key].total++;
      if (rec.status === 'present' || rec.status === 'od') subjectMap[key].present++;
    }

    return {
      records,
      summary: Object.values(subjectMap).map((s) => ({
        subject: s.subject,
        total: s.total,
        present: s.present,
        percentage: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
      })),
    };
  },

  async getMarks(userId: string) {
    // Find student doc
    const studentDoc = await Student.findOne({ user_id: userId });
    if (!studentDoc) return [];

    return Mark.find({ student_id: studentDoc._id })
      .populate({
        path: 'component_id',
        select: 'name max_marks type',
        populate: {
          path: 'assignment_id',
          select: 'subject_id semester section',
          populate: { path: 'subject_id', select: 'name code' },
        },
      })
      .sort({ createdAt: -1 });
  },

  async getMaterials(userId: string) {
    // Get materials for all subjects assigned in assignments
    const studentDoc = await Student.findOne({ user_id: userId });
    if (!studentDoc) return [];

    // Find assignments matching this student's course+semester+section
    const assignments = await TeachingAssignment.find({
      course_id: studentDoc.course_id,
      semester: studentDoc.semester,
      section: studentDoc.section,
    }).populate('subject_id');

    const subjectIds = assignments.map((a: any) => a.subject_id?._id).filter(Boolean);
    return Material.find({ subject_id: { $in: subjectIds } })
      .populate('subject_id', 'name code')
      .populate('uploaded_by', 'name')
      .sort({ createdAt: -1 });
  },
};
