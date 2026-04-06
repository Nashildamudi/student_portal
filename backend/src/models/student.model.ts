import mongoose, { Schema, Document } from 'mongoose';

export interface IStudent extends Document {
  user_id: mongoose.Types.ObjectId;
  department_id: mongoose.Types.ObjectId;
  course_id: mongoose.Types.ObjectId;
  semester: number;
  section: string;
  roll_number: string;
  academic_year: string;
  admission_date?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    department_id: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    course_id: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    semester: { type: Number, required: true },
    section: { type: String, required: true },
    roll_number: { type: String, required: true, unique: true },
    academic_year: { type: String, required: true },
    admission_date: { type: Date },
  },
  { timestamps: true }
);

export const Student = mongoose.model<IStudent>('Student', StudentSchema);
