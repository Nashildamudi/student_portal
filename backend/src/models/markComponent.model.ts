import mongoose, { Schema } from 'mongoose';
import { IMarkComponent } from '../types';

const markComponentSchema = new Schema<IMarkComponent>(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'TeachingAssignment',
      required: [true, 'Assignment is required'],
    },
    name: {
      type: String,
      required: [true, 'Component name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    maxMarks: {
      type: Number,
      required: [true, 'Maximum marks is required'],
      min: [1, 'Maximum marks must be at least 1'],
      max: [200, 'Maximum marks cannot exceed 200'],
    },
    type: {
      type: String,
      required: [true, 'Type is required'],
      enum: ['internal', 'assignment', 'quiz', 'project', 'lab', 'other'],
      default: 'internal',
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

markComponentSchema.index({ assignmentId: 1 });

export const MarkComponent = mongoose.model<IMarkComponent>('MarkComponent', markComponentSchema);
