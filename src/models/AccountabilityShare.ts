import mongoose, { Schema, Document } from "mongoose";

export interface IAccountabilityShare extends Document {
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  partnerEmail?: string;
  notifyPartner: boolean;
  expiresAt?: Date;
  revokedAt?: Date;
  createdAt: Date;
}

const AccountabilityShareSchema = new Schema<IAccountabilityShare>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    partnerEmail: String,
    notifyPartner: { type: Boolean, default: false },
    expiresAt: Date,
    revokedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.models.AccountabilityShare ||
  mongoose.model<IAccountabilityShare>("AccountabilityShare", AccountabilityShareSchema);
