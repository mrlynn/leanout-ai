import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import FoodLogEntry from "@/models/FoodLogEntry";
import DailyCheckIn from "@/models/DailyCheckIn";
import MealPlan from "@/models/MealPlan";
import mongoose from "mongoose";

function isAdmin(email?: string | null) {
  return email && email === process.env.ADMIN_EMAIL;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await connectDB();
  const [user, foodLogCount, checkInCount, mealPlanCount, recentFoodLogs, recentCheckIns] =
    await Promise.all([
      User.findById(id).select("-password").lean(),
      FoodLogEntry.countDocuments({ userId: id }),
      DailyCheckIn.countDocuments({ userId: id }),
      MealPlan.countDocuments({ userId: id }),
      FoodLogEntry.find({ userId: id }).sort({ createdAt: -1 }).limit(10).lean(),
      DailyCheckIn.find({ userId: id }).sort({ date: -1 }).limit(10).lean(),
    ]);

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    user,
    activity: { foodLogCount, checkInCount, mealPlanCount },
    recentFoodLogs,
    recentCheckIns,
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  // Don't allow deleting the admin account itself
  await connectDB();
  const target = await User.findById(id).select("email").lean();
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (target.email === process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Cannot delete admin account" }, { status: 400 });
  }

  await Promise.all([
    User.findByIdAndDelete(id),
    FoodLogEntry.deleteMany({ userId: id }),
    DailyCheckIn.deleteMany({ userId: id }),
    MealPlan.deleteMany({ userId: id }),
  ]);

  return NextResponse.json({ deleted: true });
}
