import mongoose, { Schema, Document } from "mongoose";
import type { FoodItem, FoodSource, MealType } from "@/lib/foodLog";

export interface IFoodLogEntry extends Document {
  userId: mongoose.Types.ObjectId;
  date: string;
  mealType: MealType;
  source: FoodSource;
  foods: FoodItem[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FoodItemSchema = new Schema({
  name: { type: String, required: true },
  quantity: { type: String, required: true },
  calories: { type: Number, required: true, min: 0 },
  protein: { type: Number, required: true, min: 0 },
  carbs: { type: Number, required: true, min: 0 },
  fat: { type: Number, required: true, min: 0 },
});

const FoodLogEntrySchema = new Schema<IFoodLogEntry>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true },
    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "dinner", "snack"],
      required: true,
    },
    source: {
      type: String,
      enum: ["vision", "manual", "meal_plan", "voice"],
      required: true,
    },
    foods: { type: [FoodItemSchema], required: true, validate: [(v: FoodItem[]) => v.length > 0, "At least one food required"] },
    notes: String,
  },
  { timestamps: true }
);

FoodLogEntrySchema.index({ userId: 1, date: -1 });

export default mongoose.models.FoodLogEntry ||
  mongoose.model<IFoodLogEntry>("FoodLogEntry", FoodLogEntrySchema);
