import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { calculatePhysique, calculateMacros } from "@/lib/calculator";
import type { ActivityLevel } from "@/lib/calculator";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findById(session.user.id).lean();
  if (!user?.weightLbs || !user?.bodyFatPercent || !user?.heightInches || !user?.age || !user?.sex || !user?.activityLevel || !user?.goalType) {
    return NextResponse.json({ error: "Onboarding incomplete" }, { status: 400 });
  }

  const physique = calculatePhysique({
    weightLbs: user.weightLbs,
    bodyFatPercent: user.bodyFatPercent,
    heightInches: user.heightInches,
    age: user.age,
    sex: user.sex as "male" | "female",
    activityLevel: user.activityLevel as ActivityLevel,
    goalType: user.goalType as "lose_fat" | "maintain" | "build_muscle",
  });

  const macros = calculateMacros(physique.targetCalories, physique.leanBodyMassLbs);
  return NextResponse.json({
    ...macros,
    maintenanceCalories: physique.maintenanceCalories,
    goalType: user.goalType,
  });
}
