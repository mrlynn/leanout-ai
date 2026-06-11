import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import DailyCheckIn from "@/models/DailyCheckIn";
import { syncWeightFromCheckIn } from "@/lib/physique";

function todayDate(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { steps, weightLbs, source } = body;

  if (steps !== undefined && (typeof steps !== "number" || steps < 0 || steps > 100000)) {
    return NextResponse.json({ error: "Invalid steps" }, { status: 400 });
  }
  if (weightLbs !== undefined && (typeof weightLbs !== "number" || weightLbs < 50 || weightLbs > 600)) {
    return NextResponse.json({ error: "Invalid weight" }, { status: 400 });
  }
  if (steps === undefined && weightLbs === undefined) {
    return NextResponse.json({ error: "steps or weightLbs required" }, { status: 400 });
  }

  await connectDB();
  const userId = session.user.id;
  const user = await User.findById(userId).lean();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const day = todayDate();
  const existing = await DailyCheckIn.findOne({ userId, date: day }).lean();

  const fields: Record<string, unknown> = {
    userId,
    date: day,
    weightLbs: weightLbs ?? existing?.weightLbs ?? user.weightLbs,
    hunger: existing?.hunger ?? 5,
    energy: existing?.energy ?? 5,
    compliance: existing?.compliance ?? 5,
    workoutCompleted: existing?.workoutCompleted ?? false,
  };
  if (typeof steps === "number") fields.steps = Math.round(steps);

  if (fields.weightLbs === undefined) {
    return NextResponse.json(
      {
        error:
          "No weight on file. Log weight in Apple Health or enter it on check-in, then sync again.",
      },
      { status: 400 }
    );
  }

  const checkIn = await DailyCheckIn.findOneAndUpdate(
    { userId, date: day },
    fields,
    { upsert: true, new: true, runValidators: true }
  );

  if (typeof weightLbs === "number") {
    await syncWeightFromCheckIn(userId, weightLbs);
  }

  await User.findByIdAndUpdate(userId, {
    lastHealthSyncAt: new Date(),
    healthSyncEnabled: true,
    ...(typeof weightLbs === "number" ? { weightLbs } : {}),
  });

  return NextResponse.json({
    checkIn,
    synced: { steps, weightLbs, source: source ?? "manual" },
  });
}
