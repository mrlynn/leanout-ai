import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import MealPlan from "@/models/MealPlan";
import { getUserContext } from "@/lib/userContext";
import { MealPlanView } from "@/components/MealPlanView";

export default async function MealPlanPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();
  const [mealPlanDoc, context] = await Promise.all([
    MealPlan.findOne({ userId: session.user.id }).sort({ createdAt: -1 }).lean(),
    getUserContext(session.user.id),
  ]);

  const initialMealPlan = mealPlanDoc
    ? {
        days: mealPlanDoc.days,
        groceryList: mealPlanDoc.groceryList ?? {
          protein: [],
          vegetables: [],
          fruits: [],
          carbs: [],
          fats: [],
          condiments: [],
        },
        calories: mealPlanDoc.calories,
        protein: mealPlanDoc.protein,
        carbs: mealPlanDoc.carbs,
        fat: mealPlanDoc.fat,
      }
    : null;

  const initialTargets = context?.macros
    ? {
        calories: context.macros.calories,
        protein: context.macros.proteinG,
        carbs: context.macros.carbsG,
        fat: context.macros.fatG,
        goalType: context.macros.goalType,
        maintenanceCalories: context.macros.maintenanceCalories,
      }
    : null;

  return <MealPlanView initialMealPlan={initialMealPlan} initialTargets={initialTargets} />;
}
