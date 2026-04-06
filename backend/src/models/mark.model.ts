import mongoose, { Schema } from 'mongoose';
import { IMark } from '../types';

const markSchema = new Schema<IMark>(
  {
    componentId: {
      type: Schema.Types.ObjectId,
      ref: 'MarkComponent',
      required: [true, 'Component is required'],
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required'],
    },
    marksObtained: {
      type: Number,
      required: [true, 'Marks obtained is required'],
      min: [0, 'Marks cannot be negative'],
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [500, 'Remarks cannot exceed 500 characters'],
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

// Unique constraint: one mark per student per component
markSchema.index({ componentId: 1, studentId: 1 }, { unique: true });
markSchema.index({ studentId: 1 });

export const Mark = mongoose.model<IMark>('Mark', markSchema);
