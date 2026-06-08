import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import AppConfig from "@/models/AppConfig";

function isAdmin(email?: string | null) {
  return email && email === process.env.ADMIN_EMAIL;
}

export async function GET() {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  let config = await AppConfig.findOne().lean();
  if (!config) {
    const created = await AppConfig.create({});
    config = created.toObject();
  }
  return NextResponse.json({ limits: config!.limits });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { limits } = body;
  if (!limits || typeof limits !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const allowed = ["mealPlansPerMonth", "photoLogsPerDay", "voiceLogsPerDay", "coachMessagesPerDay"];
  const update: Record<string, number> = {};
  for (const key of allowed) {
    if (key in limits) {
      const v = Number(limits[key]);
      if (!Number.isInteger(v) || v < 0) {
        return NextResponse.json({ error: `${key} must be a non-negative integer` }, { status: 400 });
      }
      update[`limits.${key}`] = v;
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  await connectDB();
  const config = await AppConfig.findOneAndUpdate(
    {},
    { $set: update },
    { upsert: true, new: true }
  );

  return NextResponse.json({ limits: config.limits });
}
