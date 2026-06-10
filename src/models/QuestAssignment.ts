import mongoose, { Schema, Document } from "mongoose";

export interface IQuestSlot {
  questId: string;
  params: Record<string, unknown>;
  progress: number;
  target: number;
  completedAt?: Date;
  xpAwarded: boolean;
}

export interface IQuestAssignment extends Document {
  userId: mongoose.Types.ObjectId;
  weekStart: string; // "YYYY-MM-DD" (Monday)
  quests: IQuestSlot[];
  createdAt: Date;
}

const QuestSlotSchema = new Schema<IQuestSlot>(
  {
    questId: { type: String, required: true },
    params: { type: Schema.Types.Mixed, default: {} },
    progress: { type: Number, default: 0 },
    target: { type: Number, required: true },
    completedAt: Date,
    xpAwarded: { type: Boolean, default: false },
  },
  { _id: false }
);

const QuestAssignmentSchema = new Schema<IQuestAssignment>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    weekStart: { type: String, required: true },
    quests: [QuestSlotSchema],
  },
  { timestamps: true }
);

QuestAssignmentSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

export default mongoose.models.QuestAssignment ||
  mongoose.model<IQuestAssignment>("QuestAssignment", QuestAssignmentSchema);
