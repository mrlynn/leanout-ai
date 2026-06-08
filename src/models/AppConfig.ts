import mongoose, { Schema, Document } from "mongoose";

export interface IAppConfig extends Document {
  // Usage limits — 0 means unlimited
  limits: {
    mealPlansPerMonth: number;
    photoLogsPerDay: number;
    voiceLogsPerDay: number;
    coachMessagesPerDay: number;
  };
  updatedAt: Date;
}

const AppConfigSchema = new Schema<IAppConfig>(
  {
    limits: {
      mealPlansPerMonth: { type: Number, default: 5 },
      photoLogsPerDay:   { type: Number, default: 10 },
      voiceLogsPerDay:   { type: Number, default: 10 },
      coachMessagesPerDay: { type: Number, default: 30 },
    },
  },
  { timestamps: true }
);

export default mongoose.models.AppConfig ||
  mongoose.model<IAppConfig>("AppConfig", AppConfigSchema);
