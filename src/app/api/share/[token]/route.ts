import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { connectDB } from "@/lib/mongodb";
import AccountabilityShare from "@/models/AccountabilityShare";
import User from "@/models/User";
import DailyCheckIn from "@/models/DailyCheckIn";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token) return NextResponse.json({ error: "Invalid token" }, { status: 400 });

  await connectDB();
  const share = await AccountabilityShare.findOne({
    tokenHash: hashToken(token),
    revokedAt: null,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  }).lean();

  if (!share) return NextResponse.json({ error: "Link expired or revoked" }, { status: 404 });

  const user = await User.findById(share.userId)
    .select("name currentStreak longestStreak lastCheckInDate")
    .lean();
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const checkIns = await DailyCheckIn.find({ userId: share.userId })
    .sort({ date: -1 })
    .limit(14)
    .select("date weightLbs compliance workoutCompleted")
    .lean();

  const firstName = user.name?.split(" ")[0] ?? "User";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last = user.lastCheckInDate ? new Date(user.lastCheckInDate) : null;
  last?.setHours(0, 0, 0, 0);
  const checkedInToday = last && last.getTime() === today.getTime();

  const weekCompliance =
    checkIns.length > 0
      ? Math.round(checkIns.reduce((s, c) => s + c.compliance, 0) / checkIns.length * 100)
      : 0;

  return NextResponse.json({
    name: firstName,
    currentStreak: user.currentStreak ?? 0,
    longestStreak: user.longestStreak ?? 0,
    checkedInToday,
    weekCompliance,
    weights: checkIns
      .filter((c) => c.weightLbs)
      .map((c) => ({ date: c.date, weight: c.weightLbs }))
      .reverse(),
    workoutsThisWeek: checkIns.filter((c) => c.workoutCompleted).length,
  });
}
