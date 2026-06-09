import mongoose, { Schema, Document } from "mongoose";

export interface ICoachMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ICoachSession extends Document {
  userId: mongoose.Types.ObjectId;
  messages: ICoachMessage[];
  systemPrompt: string;
  contextUpdatedAt: Date;
  updatedAt: Date;
}

const CoachMessageSchema = new Schema<ICoachMessage>(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
  },
  { _id: false }
);

const CoachSessionSchema = new Schema<ICoachSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    messages: { type: [CoachMessageSchema], default: [] },
    systemPrompt: { type: String, default: "" },
    contextUpdatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.CoachSession ??
  mongoose.model<ICoachSession>("CoachSession", CoachSessionSchema);
