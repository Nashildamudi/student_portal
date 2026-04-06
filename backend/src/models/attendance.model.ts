import mongoose, { Schema } from 'mongoose';
import { IAttendance } from '../types';

const attendanceSchema = new Schema<IAttendance>(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'TeachingAssignment',
      required: [true, 'Assignment is required'],
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    session: {
      type: String,
      required: [true, 'Session is required'],
      trim: true,
      enum: ['morning', 'afternoon', 'session1', 'session2', 'session3'],
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: ['present', 'absent', 'od', 'medical_leave'],
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recorded by is required'],
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

// Unique constraint: one record per student per assignment per date per session
attendanceSchema.index(
  { assignmentId: 1, studentId: 1, date: 1, session: 1 },
  { unique: true }
);
attendanceSchema.index({ studentId: 1, date: 1 });

export const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);
