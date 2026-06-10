import mongoose, { Schema, Document } from "mongoose";

export interface LimitBlock {
  mealPlansPerMonth: number;
  photoLogsPerDay: number;
  voiceLogsPerDay: number;
  coachMessagesPerDay: number;
  workoutGenerationsPerMonth: number;
}

export interface HealthSnapshot {
  ok: boolean;
  checkedAt: string;
  mongodb: string;
  missingEnv: string[];
  providerFailures: { name: string; error?: string }[];
  source: "cron" | "manual";
}

export interface IAppConfig extends Document {
  // Usage limits — 0 means unlimited
  limits: LimitBlock;
  proLimits: LimitBlock;
  lastHealthCheck?: HealthSnapshot;
  updatedAt: Date;
}

const AppConfigSchema = new Schema<IAppConfig>(
  {
    limits: {
      mealPlansPerMonth: { type: Number, default: 5 },
      photoLogsPerDay:   { type: Number, default: 10 },
      voiceLogsPerDay:   { type: Number, default: 10 },
      coachMessagesPerDay: { type: Number, default: 30 },
      workoutGenerationsPerMonth: { type: Number, default: 3 },
    },
    proLimits: {
      mealPlansPerMonth: { type: Number, default: 0 },
      photoLogsPerDay:   { type: Number, default: 50 },
      voiceLogsPerDay:   { type: Number, default: 50 },
      coachMessagesPerDay: { type: Number, default: 0 },
      workoutGenerationsPerMonth: { type: Number, default: 10 },
    },
    lastHealthCheck: {
      ok: Boolean,
      checkedAt: String,
      mongodb: String,
      missingEnv: [String],
      providerFailures: [{ name: String, error: String }],
      source: { type: String, enum: ["cron", "manual"] },
    },
  },
  { timestamps: true }
);

export default mongoose.models.AppConfig ||
  mongoose.model<IAppConfig>("AppConfig", AppConfigSchema);
