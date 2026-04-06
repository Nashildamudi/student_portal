import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance extends Document {
  assignment_id: mongoose.Types.ObjectId;
  student_id: mongoose.Types.ObjectId;
  date: Date;
  session: string;
  status: 'present' | 'absent' | 'od' | 'medical_leave';
  recorded_by?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    assignment_id: { type: Schema.Types.ObjectId, ref: 'TeachingAssignment', required: true },
    student_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    session: { type: String, required: true },
    status: { type: String, enum: ['present', 'absent', 'od', 'medical_leave'], required: true },
    recorded_by: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

AttendanceSchema.index({ student_id: 1, assignment_id: 1, date: 1, session: 1 }, { unique: true });

export const Attendance = mongoose.model<IAttendance>('Attendance', AttendanceSchema, 'attendance');
