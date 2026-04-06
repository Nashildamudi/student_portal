import mongoose, { Schema, Document } from 'mongoose';

export interface IMark extends Document {
  component_id: mongoose.Types.ObjectId;
  student_id: mongoose.Types.ObjectId;
  assignment_id?: mongoose.Types.ObjectId;
  marks_obtained: number;
  remarks?: string;
  recorded_by?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MarkSchema = new Schema<IMark>(
  {
    component_id: { type: Schema.Types.ObjectId, ref: 'MarkComponent', required: true },
    student_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignment_id: { type: Schema.Types.ObjectId, ref: 'TeachingAssignment' },
    marks_obtained: { type: Number, required: true },
    remarks: { type: String },
    recorded_by: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Unique: one mark entry per student per component
MarkSchema.index({ student_id: 1, component_id: 1 }, { unique: true });

export const Mark = mongoose.model<IMark>('Mark', MarkSchema, 'marks');
