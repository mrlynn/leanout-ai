import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import WorkoutPlan from "@/models/WorkoutPlan";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  await connectDB();
  const plan = await WorkoutPlan.findOne({ userId: session.user.id }).lean();
  if (!plan) {
    return NextResponse.json({ error: "No plan found" }, { status: 404 });
  }

  return NextResponse.json({ plan });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { goal, preferences, schedule } = await req.json();

  await connectDB();
  const plan = await WorkoutPlan.findOneAndUpdate(
    { userId: session.user.id },
    {
      userId: session.user.id,
      goal,
      preferences,
      schedule,
      generatedAt: new Date(),
    },
    { upsert: true, new: true }
  ).lean();

  return NextResponse.json({ plan });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  await connectDB();

  const allowed = ["startDay"] as const;
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  const plan = await WorkoutPlan.findOneAndUpdate(
    { userId: session.user.id },
    { $set: update },
    { new: true }
  ).lean();

  return NextResponse.json({ plan });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  await connectDB();
  await WorkoutPlan.deleteOne({ userId: session.user.id });

  return NextResponse.json({ ok: true });
}
