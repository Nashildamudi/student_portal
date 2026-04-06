import mongoose, { Schema, Document } from 'mongoose';

export interface IMaterial extends Document {
  title: string;
  filename: string;
  filepath: string;
  subject_id: mongoose.Types.ObjectId;
  uploaded_by: mongoose.Types.ObjectId;
  department_id?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const MaterialSchema = new Schema<IMaterial>(
  {
    title: { type: String, required: true },
    filename: { type: String, required: true },
    filepath: { type: String, required: true },
    subject_id: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    uploaded_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    department_id: { type: Schema.Types.ObjectId, ref: 'Department' },
  },
  { timestamps: true }
);

export const Material = mongoose.model<IMaterial>('Material', MaterialSchema);
