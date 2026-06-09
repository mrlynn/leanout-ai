import mongoose, { Schema, Document } from "mongoose";

export interface IMeal {
  name: string;
  foods: { item: string; quantity: string; calories: number; protein: number; carbs: number; fat: number }[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface IDay {
  day: string;
  meals: IMeal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface IMealPlan extends Document {
  userId: mongoose.Types.ObjectId;
  startDate: Date;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  days: IDay[];
  groceryList?: {
    protein: string[];
    vegetables: string[];
    fruits: string[];
    carbs: string[];
    fats: string[];
    condiments: string[];
  };
  createdAt: Date;
}

const FoodSchema = new Schema({
  item: String,
  quantity: String,
  calories: Number,
  protein: Number,
  carbs: Number,
  fat: Number,
});

const MealSchema = new Schema({
  name: String,
  foods: [FoodSchema],
  totalCalories: Number,
  totalProtein: Number,
  totalCarbs: Number,
  totalFat: Number,
});

const DaySchema = new Schema({
  day: String,
  meals: [MealSchema],
  totalCalories: Number,
  totalProtein: Number,
  totalCarbs: Number,
  totalFat: Number,
});

const MealPlanSchema = new Schema<IMealPlan>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    startDate: { type: Date, default: Date.now },
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    days: [DaySchema],
    groceryList: {
      protein: [String],
      vegetables: [String],
      fruits: [String],
      carbs: [String],
      fats: [String],
      condiments: [String],
    },
  },
  { timestamps: true }
);

MealPlanSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.MealPlan || mongoose.model<IMealPlan>("MealPlan", MealPlanSchema);
