import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import DailyCheckIn from "@/models/DailyCheckIn";
import mongoose from "mongoose";
import { awardCheckIn } from "@/lib/awardXP";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();
  await connectDB();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Upsert — one check-in per day
  const checkIn = await DailyCheckIn.findOneAndUpdate(
    { userId: session.user.id, date: today },
    { ...data, userId: session.user.id, date: today },
    { upsert: true, new: true }
  );

  // Award XP + badges (don't block response on failure)
  let reward = null;
  try {
    reward = await awardCheckIn(session.user.id, {
      compliance: data.compliance,
      workoutCompleted: data.workoutCompleted,
      steps: data.steps,
      weightLbs: data.weightLbs,
    });
  } catch (e) {
    console.error("awardCheckIn failed", e);
  }

  return NextResponse.json({ checkIn, reward });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") ?? "30");

  await connectDB();
  const checkIns = await DailyCheckIn.find({ userId: session.user.id })
    .sort({ date: -1 })
    .limit(limit)
    .lean();

  return NextResponse.json({ checkIns });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, ...data } = await req.json();
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await connectDB();
  const updated = await DailyCheckIn.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    { $set: data },
    { new: true }
  );

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ checkIn: updated });
}
