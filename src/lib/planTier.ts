import { NextResponse } from "next/server";
import { connectDB } from "./mongodb";
import User from "@/models/User";
import { isProActive, type PlanTier } from "./billing";

export async function getUserPlanTier(userId: string): Promise<PlanTier> {
  await connectDB();
  const user = await User.findById(userId).select("planTier subscriptionStatus").lean();
  if (!user) return "free";
  return isProActive(user.planTier, user.subscriptionStatus) ? "pro" : "free";
}

export async function requirePro(userId: string) {
  const tier = await getUserPlanTier(userId);
  if (tier !== "pro") {
    return NextResponse.json(
      { error: "pro_required", message: "This feature requires LeanOut Pro" },
      { status: 403 }
    );
  }
  return null;
}
