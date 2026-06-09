import mongoose, { Schema, Document } from "mongoose";

export interface ISavedMeal extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  mealType: string;
  foods: {
    name: string;
    quantity: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }[];
  createdAt: Date;
}

const SavedMealSchema = new Schema<ISavedMeal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    mealType: { type: String, required: true },
    foods: [
      {
        name: String,
        quantity: String,
        calories: Number,
        protein: Number,
        carbs: Number,
        fat: Number,
      },
    ],
  },
  { timestamps: true }
);

SavedMealSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.SavedMeal ??
  mongoose.model<ISavedMeal>("SavedMeal", SavedMealSchema);
