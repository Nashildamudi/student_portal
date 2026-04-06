import mongoose, { Schema } from 'mongoose';
import { IMaterial } from '../types';

const materialSchema = new Schema<IMaterial>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    filename: {
      type: String,
      required: [true, 'Filename is required'],
      trim: true,
    },
    filepath: {
      type: String,
      required: [true, 'Filepath is required'],
      trim: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required'],
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploaded by is required'],
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

materialSchema.index({ subjectId: 1 });
materialSchema.index({ uploadedBy: 1 });

export const Material = mongoose.model<IMaterial>('Material', materialSchema);
