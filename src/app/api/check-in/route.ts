import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import DailyCheckIn from "@/models/DailyCheckIn";
import mongoose from "mongoose";
import { awardCheckIn } from "@/lib/awardXP";
import { pickCheckInFields } from "@/lib/validation";
import { syncWeightFromCheckIn } from "@/lib/physique";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();
  const parsed = pickCheckInFields(data);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { fields } = parsed;
  if (fields.weightLbs === undefined || fields.hunger === undefined || fields.energy === undefined || fields.compliance === undefined) {
    return NextResponse.json({ error: "weightLbs, hunger, energy, and compliance are required" }, { status: 400 });
  }

  await connectDB();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkIn = await DailyCheckIn.findOneAndUpdate(
    { userId: session.user.id, date: today },
    { ...fields, userId: session.user.id, date: today },
    { upsert: true, new: true, runValidators: true }
  );

  await syncWeightFromCheckIn(session.user.id, fields.weightLbs as number);

  let reward = null;
  try {
    reward = await awardCheckIn(session.user.id, {
      compliance: fields.compliance as number,
      workoutCompleted: (fields.workoutCompleted as boolean | undefined) ?? false,
      steps: fields.steps as number | undefined,
      weightLbs: fields.weightLbs as number,
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
  const limit = Math.min(365, Math.max(1, parseInt(searchParams.get("limit") ?? "30") || 30));

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

  const parsed = pickCheckInFields(data);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  await connectDB();
  const updated = await DailyCheckIn.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    { $set: parsed.fields },
    { new: true, runValidators: true }
  );

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (parsed.fields.weightLbs) {
    await syncWeightFromCheckIn(session.user.id, parsed.fields.weightLbs as number);
  }

  return NextResponse.json({ checkIn: updated });
}
