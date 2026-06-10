import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import QuestAssignment, { IQuestSlot } from "@/models/QuestAssignment";
import { levelFromXP, xpProgress, BADGES } from "@/lib/gamification";
import { QUEST_MAP, currentWeekStart, refreshQuestProgress } from "@/lib/quests";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findById(session.user.id)
    .select("xp xpSpendable currentStreak longestStreak earnedBadges startingWeightLbs weightLbs streakFreezes")
    .lean();

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const xp       = user.xp ?? 0;
  const progress = xpProgress(xp);
  const earned   = new Set(user.earnedBadges ?? []);
  const badges   = BADGES.map((b) => ({ ...b, earned: earned.has(b.id) }));

  const weekStart = currentWeekStart();
  await refreshQuestProgress(session.user.id);

  const assignment = await QuestAssignment.findOne({
    userId: session.user.id,
    weekStart,
  }).lean();

  const quests = (assignment?.quests ?? [] as IQuestSlot[]).map((slot: IQuestSlot) => {
    const def = QUEST_MAP[slot.questId];
    return {
      questId: slot.questId,
      name: def?.name ?? slot.questId,
      description: def?.description(slot.params) ?? "",
      xpReward: def?.xpReward ?? 0,
      progress: slot.progress,
      target: slot.target,
      completed: !!slot.completedAt,
    };
  });

  return NextResponse.json({
    xp,
    xpSpendable: user.xpSpendable ?? 0,
    level: progress.level,
    xpCurrent: progress.current,
    xpNeeded: progress.needed,
    xpPct: progress.pct,
    currentStreak: user.currentStreak ?? 0,
    longestStreak: user.longestStreak ?? 0,
    streakFreezes: user.streakFreezes ?? 0,
    badges,
    earnedCount: earned.size,
    totalBadges: BADGES.length,
    quests,
    weekStart,
  });
}
