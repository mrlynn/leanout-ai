import mongoose, { Schema, Document } from "mongoose";
import type { UsageFeature } from "./UserUsage";

export interface ILimitReachedEvent extends Document {
  userId: mongoose.Types.ObjectId;
  feature: UsageFeature;
  createdAt: Date;
}

const LimitReachedEventSchema = new Schema<ILimitReachedEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    feature: { type: String, required: true },
  },
  { timestamps: true }
);

LimitReachedEventSchema.index({ createdAt: -1 });

export default mongoose.models.LimitReachedEvent ||
  mongoose.model<ILimitReachedEvent>("LimitReachedEvent", LimitReachedEventSchema);
