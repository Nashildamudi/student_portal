import mongoose, { Schema } from 'mongoose';
import { ICourse } from '../types';

const courseSchema = new Schema<ICourse>(
  {
    name: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    code: {
      type: String,
      required: [true, 'Course code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [20, 'Code cannot exceed 20 characters'],
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    totalSemesters: {
      type: Number,
      default: 8,
      min: [1, 'Total semesters must be at least 1'],
      max: [12, 'Total semesters cannot exceed 12'],
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

courseSchema.index({ code: 1 }, { unique: true });
courseSchema.index({ departmentId: 1 });

export const Course = mongoose.model<ICourse>('Course', courseSchema);
