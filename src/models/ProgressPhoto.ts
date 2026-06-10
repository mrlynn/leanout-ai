import mongoose, { Schema, Document } from "mongoose";

export type PhotoPose = "front" | "side" | "back";

export interface IProgressPhoto extends Document {
  userId: mongoose.Types.ObjectId;
  date: string;
  pose: PhotoPose;
  imageData?: string;
  blobUrl?: string;
  notes?: string;
  weightLbs?: number;
  createdAt: Date;
}

const ProgressPhotoSchema = new Schema<IProgressPhoto>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true },
    pose: { type: String, enum: ["front", "side", "back"], default: "front" },
    imageData: String,
    blobUrl: String,
    notes: String,
    weightLbs: Number,
  },
  { timestamps: true }
);

ProgressPhotoSchema.index({ userId: 1, date: -1 });
ProgressPhotoSchema.index({ userId: 1, date: 1, pose: 1 }, { unique: true });

export default mongoose.models.ProgressPhoto ??
  mongoose.model<IProgressPhoto>("ProgressPhoto", ProgressPhotoSchema);
