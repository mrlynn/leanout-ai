import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import AppConfig from "@/models/AppConfig";
import { getAllLimits, invalidateLimitsCache } from "@/lib/usageLimits";

function isAdmin(email?: string | null) {
  return email && email === process.env.ADMIN_EMAIL;
}

const LIMIT_KEYS = [
  "mealPlansPerMonth",
  "photoLogsPerDay",
  "voiceLogsPerDay",
  "coachMessagesPerDay",
  "workoutGenerationsPerMonth",
] as const;

function buildLimitUpdate(prefix: "limits" | "proLimits", limits: Record<string, unknown>) {
  const update: Record<string, number> = {};
  for (const key of LIMIT_KEYS) {
    if (key in limits) {
      const v = Number(limits[key]);
      if (!Number.isInteger(v) || v < 0) {
        return { error: `${key} must be a non-negative integer` };
      }
      update[`${prefix}.${key}`] = v;
    }
  }
  return { update };
}

export async function GET() {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { free, pro } = await getAllLimits();
  return NextResponse.json({ limits: free, proLimits: pro });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const update: Record<string, number> = {};

  if (body.limits) {
    const result = buildLimitUpdate("limits", body.limits);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    Object.assign(update, result.update);
  }

  if (body.proLimits) {
    const result = buildLimitUpdate("proLimits", body.proLimits);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    Object.assign(update, result.update);
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

  invalidateLimitsCache();
  return NextResponse.json({ limits: config.limits, proLimits: config.proLimits });
}
