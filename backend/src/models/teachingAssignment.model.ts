import mongoose, { Schema } from 'mongoose';
import { ITeachingAssignment } from '../types';

const teachingAssignmentSchema = new Schema<ITeachingAssignment>(
  {
    facultyId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Faculty is required'],
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required'],
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course is required'],
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: [1, 'Semester must be at least 1'],
      max: [12, 'Semester cannot exceed 12'],
    },
    section: {
      type: String,
      required: [true, 'Section is required'],
      uppercase: true,
      trim: true,
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      trim: true,
      match: [/^\d{4}-\d{2}$/, 'Academic year must be in format YYYY-YY'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Unique constraint: one faculty can only be assigned once to a subject/section/year combo
teachingAssignmentSchema.index(
  { subjectId: 1, semester: 1, section: 1, academicYear: 1 },
  { unique: true }
);
teachingAssignmentSchema.index({ facultyId: 1 });

export const TeachingAssignment = mongoose.model<ITeachingAssignment>(
  'TeachingAssignment',
  teachingAssignmentSchema
);
