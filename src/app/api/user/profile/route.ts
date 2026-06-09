import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

const PROFILE_FIELDS = [
  "name",
  "age",
  "sex",
  "heightInches",
  "weightLbs",
  "bodyFatPercent",
  "activityLevel",
  "trainingFrequency",
  "goalType",
  "goalBodyFatPercent",
  "goalDate",
  "vacationDate",
  "foodPreferences",
  "allergies",
  "supplements",
  "onTRT",
  "timezone",
  "reminderHour",
  "remindersEnabled",
] as const;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findById(session.user.id).select("-password").lean();
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();
  const unknown = Object.keys(data).filter((k) => !PROFILE_FIELDS.includes(k as (typeof PROFILE_FIELDS)[number]));
  if (unknown.length > 0) {
    return NextResponse.json({ error: `Unknown fields: ${unknown.join(", ")}` }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  for (const key of PROFILE_FIELDS) {
    if (key in data) update[key] = data[key];
  }

  await connectDB();
  const user = await User.findByIdAndUpdate(session.user.id, update, { new: true, runValidators: true }).select("-password");
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ user });
}
