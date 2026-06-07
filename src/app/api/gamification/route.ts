import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { levelFromXP, xpProgress, BADGES } from "@/lib/gamification";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findById(session.user.id)
    .select("xp currentStreak longestStreak earnedBadges startingWeightLbs weightLbs")
    .lean();

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const xp       = user.xp ?? 0;
  const progress = xpProgress(xp);
  const earned   = new Set(user.earnedBadges ?? []);

  const badges = BADGES.map((b) => ({ ...b, earned: earned.has(b.id) }));

  return NextResponse.json({
    xp,
    level: progress.level,
    xpCurrent: progress.current,
    xpNeeded: progress.needed,
    xpPct: progress.pct,
    currentStreak: user.currentStreak ?? 0,
    longestStreak: user.longestStreak ?? 0,
    badges,
    earnedCount: earned.size,
    totalBadges: BADGES.length,
  });
}
