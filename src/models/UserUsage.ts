import mongoose, { Schema, Document } from "mongoose";

export type UsageFeature = "meal_plan" | "photo_log" | "voice_log" | "coach_message" | "workout_generation";
export type UsagePeriod = "daily" | "monthly";

export interface IUserUsage extends Document {
  userId: mongoose.Types.ObjectId;
  feature: UsageFeature;
  period: UsagePeriod;
  periodKey: string; // "2026-06" for monthly, "2026-06-08" for daily
  count: number;
}

const UserUsageSchema = new Schema<IUserUsage>({
  userId:    { type: Schema.Types.ObjectId, ref: "User", required: true },
  feature:   { type: String, required: true },
  period:    { type: String, enum: ["daily", "monthly"], required: true },
  periodKey: { type: String, required: true },
  count:     { type: Number, default: 0 },
});

// Unique per user + feature + period window
UserUsageSchema.index({ userId: 1, feature: 1, period: 1, periodKey: 1 }, { unique: true });

export default mongoose.models.UserUsage ||
  mongoose.model<IUserUsage>("UserUsage", UserUsageSchema);
