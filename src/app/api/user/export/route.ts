import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import DailyCheckIn from "@/models/DailyCheckIn";
import FoodLogEntry from "@/models/FoodLogEntry";
import MealPlan from "@/models/MealPlan";
import WorkoutPlan from "@/models/WorkoutPlan";
import WorkoutSession from "@/models/WorkoutSession";
import ProgressPhoto from "@/models/ProgressPhoto";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const userId = session.user.id;

  const [user, checkIns, foodLogs, mealPlans, workoutPlans, workoutSessions, photos] =
    await Promise.all([
      User.findById(userId).select("-password -passwordResetHash").lean(),
      DailyCheckIn.find({ userId }).sort({ date: -1 }).lean(),
      FoodLogEntry.find({ userId }).sort({ date: -1 }).lean(),
      MealPlan.find({ userId }).sort({ createdAt: -1 }).lean(),
      WorkoutPlan.find({ userId }).lean(),
      WorkoutSession.find({ userId }).sort({ date: -1 }).lean(),
      ProgressPhoto.find({ userId }).select("-imageData").lean(),
    ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    user,
    checkIns,
    foodLogs,
    mealPlans,
    workoutPlans,
    workoutSessions,
    progressPhotos: photos,
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="leanout-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
