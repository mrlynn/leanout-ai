import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import WorkoutSession from "@/models/WorkoutSession";
import { getDateString } from "@/lib/foodLog";
import { refreshQuestProgress } from "@/lib/quests";
import {
  computePersonalRecords,
  getLastSessionForWorkout,
  type ExerciseLog,
} from "@/lib/workoutProgression";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? getDateString();
  const workoutName = searchParams.get("workoutName");

  await connectDB();
  const workout = await WorkoutSession.findOne({ userId: session.user.id, date }).lean();

  let lastSession = null;
  let progressionHints: Record<string, string> = {};

  if (workoutName) {
    lastSession = await getLastSessionForWorkout(session.user.id, workoutName, date);
    if (lastSession) {
      for (const ex of lastSession.exercises) {
        const best = ex.sets.reduce(
          (m, s) => (s.weightLbs && s.reps ? Math.max(m, s.weightLbs) : m),
          0
        );
        const topReps = ex.sets.find((s) => s.weightLbs === best)?.reps;
        if (best > 0) {
          progressionHints[ex.name] = `Last time: ${best} lbs × ${topReps ?? "?"} reps — try +5 lbs`;
        }
      }
    }
  }

  return NextResponse.json({ session: workout, lastSession, progressionHints });
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

  let completedQuests: string[] = [];
  let personalRecords: Record<string, { weightLbs: number; isNewPr: boolean }> = {};

  if (complete) {
    completedQuests = await refreshQuestProgress(session.user.id);
    personalRecords = await computePersonalRecords(
      session.user.id,
      exercises as ExerciseLog[]
    );
  }

  return NextResponse.json({ session: workout, completedQuests, personalRecords });
}
