import mongoose, { Schema, Document } from "mongoose";

export interface IGuide extends Document {
  title: string;
  slug: string;
  summary: string;
  content: string; // markdown
  emoji: string;
  category: string;
  tags: string[];
  published: boolean;
  authorEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

const GuideSchema = new Schema<IGuide>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    summary: { type: String, default: "" },
    content: { type: String, default: "" },
    emoji: { type: String, default: "📖" },
    category: { type: String, default: "General" },
    tags: [{ type: String }],
    published: { type: Boolean, default: false },
    authorEmail: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Guide ?? mongoose.model<IGuide>("Guide", GuideSchema);
