import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  role: 'admin' | 'faculty' | 'student';
  register_number?: string;
  department_id?: mongoose.Types.ObjectId;
  course_id?: mongoose.Types.ObjectId;
  semester?: number;
  section?: string;
  academic_year?: string;
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String },
    password: { type: String, select: false },
    role: { type: String, enum: ['admin', 'faculty', 'student'], required: true },
    register_number: { type: String, unique: true, sparse: true },
    department_id: { type: Schema.Types.ObjectId, ref: 'Department' },
    course_id: { type: Schema.Types.ObjectId, ref: 'Course' },
    semester: { type: Number },
    section: { type: String },
    academic_year: { type: String },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
