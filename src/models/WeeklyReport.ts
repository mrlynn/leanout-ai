import mongoose, { Schema, Document } from "mongoose";

export interface IWeeklyReport extends Document {
  userId: mongoose.Types.ObjectId;
  weekStart: string; // YYYY-MM-DD
  headline: string;
  content: string;
  emailSentAt?: Date;
  createdAt: Date;
}

const WeeklyReportSchema = new Schema<IWeeklyReport>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    weekStart: { type: String, required: true },
    headline: { type: String, required: true },
    content: { type: String, required: true },
    emailSentAt: Date,
  },
  { timestamps: true }
);

WeeklyReportSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

export default mongoose.models.WeeklyReport ||
  mongoose.model<IWeeklyReport>("WeeklyReport", WeeklyReportSchema);
