import mongoose, { Schema, Document } from "mongoose";

export interface IDailyCheckIn extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  weightLbs: number;
  steps?: number;
  hunger: number;
  energy: number;
  compliance: number;
  workoutCompleted: boolean;
  notes?: string;
  createdAt: Date;
}

const DailyCheckInSchema = new Schema<IDailyCheckIn>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    weightLbs: { type: Number, required: true },
    steps: Number,
    hunger: { type: Number, min: 1, max: 10, required: true },
    energy: { type: Number, min: 1, max: 10, required: true },
    compliance: { type: Number, min: 1, max: 10, required: true },
    workoutCompleted: { type: Boolean, default: false },
    notes: String,
  },
  { timestamps: true }
);

DailyCheckInSchema.index({ userId: 1, date: -1 });

export default mongoose.models.DailyCheckIn ||
  mongoose.model<IDailyCheckIn>("DailyCheckIn", DailyCheckInSchema);
