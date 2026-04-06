import mongoose, { Schema, Document } from 'mongoose';

export interface ITeachingAssignment extends Document {
  faculty_id: mongoose.Types.ObjectId;
  subject_id: mongoose.Types.ObjectId;
  department_id: mongoose.Types.ObjectId;
  course_id: mongoose.Types.ObjectId;
  section: string;
  semester: number;
  academic_year: string;
  createdAt: Date;
  updatedAt: Date;
}

const TeachingAssignmentSchema = new Schema<ITeachingAssignment>(
  {
    faculty_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subject_id: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    department_id: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    course_id: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    section: { type: String, required: true },
    semester: { type: Number, required: true },
    academic_year: { type: String, required: true },
  },
  { timestamps: true }
);

TeachingAssignmentSchema.index({ subject_id: 1, semester: 1, section: 1, academic_year: 1 }, { unique: true });

export const TeachingAssignment = mongoose.model<ITeachingAssignment>(
  'TeachingAssignment',
  TeachingAssignmentSchema,
  'teaching_assignments'
);
