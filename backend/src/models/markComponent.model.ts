import mongoose, { Schema, Document } from 'mongoose';

export interface IMarkComponent extends Document {
  assignment_id: mongoose.Types.ObjectId;
  name: string;
  max_marks: number;
  type: 'Internal' | 'Assignment' | 'Quiz' | 'Project' | 'Other';
  createdAt: Date;
  updatedAt: Date;
}

const MarkComponentSchema = new Schema<IMarkComponent>(
  {
    assignment_id: { type: Schema.Types.ObjectId, ref: 'TeachingAssignment', required: true },
    name: { type: String, required: true },
    max_marks: { type: Number, required: true },
    type: { type: String, enum: ['Internal', 'Assignment', 'Quiz', 'Project', 'Other'], default: 'Internal' }
  },
  { timestamps: true }
);

export const MarkComponent = mongoose.model<IMarkComponent>('MarkComponent', MarkComponentSchema, 'mark_components');
