import mongoose, { Schema, Document } from "mongoose";

export interface IProgressPhoto extends Document {
  userId: mongoose.Types.ObjectId;
  date: string;
  imageData: string;
  notes?: string;
  weightLbs?: number;
  createdAt: Date;
}

const ProgressPhotoSchema = new Schema<IProgressPhoto>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true },
    imageData: { type: String, required: true },
    notes: String,
    weightLbs: Number,
  },
  { timestamps: true }
);

ProgressPhotoSchema.index({ userId: 1, date: -1 });

export default mongoose.models.ProgressPhoto ??
  mongoose.model<IProgressPhoto>("ProgressPhoto", ProgressPhotoSchema);
