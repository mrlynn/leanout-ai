import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import WorkoutSession from "@/models/WorkoutSession";
import { getDateString } from "@/lib/foodLog";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? getDateString();

  await connectDB();
  const workout = await WorkoutSession.findOne({ userId: session.user.id, date }).lean();
  return NextResponse.json({ session: workout });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { date, workoutName, focus, exercises, durationMinutes, complete } = body;
  if (!date || !exercises) {
    return NextResponse.json({ error: "date and exercises required" }, { status: 400 });
  }

  await connectDB();
  const workout = await WorkoutSession.findOneAndUpdate(
    { userId: session.user.id, date },
    {
      userId: session.user.id,
      date,
      workoutName,
      focus,
      exercises,
      durationMinutes,
      completedAt: complete ? new Date() : undefined,
    },
    { upsert: true, new: true }
  );

  return NextResponse.json({ session: workout });
}
