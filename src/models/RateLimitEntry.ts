import mongoose, { Schema, Document } from "mongoose";

export interface IRateLimitEntry extends Document {
  key: string;
  count: number;
  windowStart: Date;
}

const RateLimitEntrySchema = new Schema<IRateLimitEntry>({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  windowStart: { type: Date, required: true },
});

RateLimitEntrySchema.index({ windowStart: 1 }, { expireAfterSeconds: 3600 });

export default mongoose.models.RateLimitEntry ??
  mongoose.model<IRateLimitEntry>("RateLimitEntry", RateLimitEntrySchema);
