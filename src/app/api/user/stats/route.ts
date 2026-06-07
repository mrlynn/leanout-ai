import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { calculatePhysique } from "@/lib/calculator";
import type { ActivityLevel } from "@/lib/calculator";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findById(session.user.id).lean();
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const physique =
    user.weightLbs && user.bodyFatPercent && user.heightInches && user.age && user.sex && user.activityLevel && user.goalType
      ? calculatePhysique({
          weightLbs: user.weightLbs,
          bodyFatPercent: user.bodyFatPercent,
          heightInches: user.heightInches,
          age: user.age,
          sex: user.sex as "male" | "female",
          activityLevel: user.activityLevel as ActivityLevel,
          goalType: user.goalType as "lose_fat" | "maintain" | "build_muscle",
        })
      : null;

  return NextResponse.json({
    weightLbs: user.weightLbs,
    bodyFatPercent: user.bodyFatPercent,
    goalWeightLbs: physique?.goalWeightLbs,
    weeksToGoal: physique?.weeksToGoal,
    goalType: user.goalType,
  });
}
