import mongoose, { Schema, Document } from 'mongoose';

export interface IFaculty extends Document {
  user_id: mongoose.Types.ObjectId;
  department_id: mongoose.Types.ObjectId;
  designation: string;
  employee_id: string;
  joining_date?: Date;
  specialization?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FacultySchema = new Schema<IFaculty>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    department_id: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    designation: { type: String, required: true },
    employee_id: { type: String, required: true, unique: true },
    joining_date: { type: Date },
    specialization: { type: String },
  },
  { timestamps: true }
);

export const Faculty = mongoose.model<IFaculty>('Faculty', FacultySchema);
