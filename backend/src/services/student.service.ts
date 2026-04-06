import { Student, Attendance, Mark, Material, TeachingAssignment, MarkComponent } from '../models';
import { ApiError } from '../utils';

export const studentService = {
  // Get student profile
  async getMyProfile(userId: string) {
    const student = await Student.findOne({ userId })
      .populate('userId', 'name email phone')
      .populate('departmentId', 'name code')
      .populate('courseId', 'name code totalSemesters');

    if (!student) throw ApiError.notFound('Student profile not found');
    return student;
  },

  // Get attendance summary
  async getMyAttendance(userId: string) {
    const student = await Student.findOne({ userId });
    if (!student) throw ApiError.notFound('Student profile not found');

    // Get all assignments for this student's class
    const assignments = await TeachingAssignment.find({
      courseId: student.courseId,
      semester: student.semester,
      section: student.section,
    }).populate('subjectId', 'name code');

    // Get attendance summary for each subject
    const attendancePromises = assignments.map(async (assignment) => {
      const records = await Attendance.find({
        assignmentId: assignment._id,
        studentId: student._id,
      }).sort({ date: -1 });

      const total = records.length;
      const present = records.filter(
        (r) => r.status === 'present' || r.status === 'od'
      ).length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

      return {
        subject: assignment.subjectId,
        total,
        present,
        absent: total - present,
        percentage,
        records: records.slice(0, 10), // Last 10 records
      };
    });

    return Promise.all(attendancePromises);
  },

  // Get marks
  async getMyMarks(userId: string) {
    const student = await Student.findOne({ userId });
    if (!student) throw ApiError.notFound('Student profile not found');

    // Get all assignments for this student's class
    const assignments = await TeachingAssignment.find({
      courseId: student.courseId,
      semester: student.semester,
      section: student.section,
    }).populate('subjectId', 'name code');

    // Get marks for each subject
    const marksPromises = assignments.map(async (assignment) => {
      const components = await MarkComponent.find({ assignmentId: assignment._id });
      const componentIds = components.map((c) => c._id);

      const marks = await Mark.find({
        componentId: { $in: componentIds },
        studentId: student._id,
      }).populate('componentId', 'name maxMarks type');

      const totalMax = components.reduce((sum, c) => sum + c.maxMarks, 0);
      const totalObtained = marks.reduce((sum, m) => sum + m.marksObtained, 0);
      const percentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;

      return {
        subject: assignment.subjectId,
        components: components.map((c) => {
          const mark = marks.find((m) => (m.componentId as unknown as { _id: { toString: () => string } })._id.toString() === c._id.toString());
          return {
            _id: c._id,
            name: c.name,
            maxMarks: c.maxMarks,
            type: c.type,
            marksObtained: mark?.marksObtained ?? null,
            remarks: mark?.remarks ?? '',
          };
        }),
        totalMax,
        totalObtained,
        percentage,
      };
    });

    return Promise.all(marksPromises);
  },

  // Get study materials
  async getMyMaterials(userId: string) {
    const student = await Student.findOne({ userId });
    if (!student) throw ApiError.notFound('Student profile not found');

    // Get subjects for this student's class
    const assignments = await TeachingAssignment.find({
      courseId: student.courseId,
      semester: student.semester,
      section: student.section,
    });
    const subjectIds = assignments.map((a) => a.subjectId);

    // Get materials for these subjects
    return Material.find({ subjectId: { $in: subjectIds } })
      .populate('subjectId', 'name code')
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });
  },
};
