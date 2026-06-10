import User from "@/models/User";
import DailyCheckIn from "@/models/DailyCheckIn";
import FoodLogEntry from "@/models/FoodLogEntry";
import { checkInXP, levelFromXP, BADGE_MAP } from "./gamification";
import {
  evaluateQuestsDetailed,
  getOrAssignQuests,
  type CompletedQuest,
} from "./quests";

export interface AwardResult {
  xpGained: number;
  newBadges: string[];
  newStreak: number;
  leveledUp: boolean;
  newLevel: number;
  freezeUsed: boolean;
  completedQuests: CompletedQuest[];
}

export async function awardCheckIn(userId: string, checkInData: {
  compliance: number;
  workoutCompleted: boolean;
  steps?: number;
  weightLbs: number;
}): Promise<AwardResult> {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const prevXP      = user.xp ?? 0;
  const prevBadges  = new Set<string>(user.earnedBadges ?? []);
  const prevStreak  = user.currentStreak ?? 0;
  const prevLevel   = levelFromXP(prevXP);
  let freezeUsed    = false;

  // ── Monthly streak freeze grant ─────────────────────────────────────────────
  const nowMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const freezeUpdates: Record<string, unknown> = {};
  if (
    user.lastFreezeGrantMonth !== nowMonth &&
    (user.streakFreezes ?? 0) < 2
  ) {
    freezeUpdates.streakFreezes = (user.streakFreezes ?? 0) + 1;
    freezeUpdates.lastFreezeGrantMonth = nowMonth;
    user.streakFreezes = freezeUpdates.streakFreezes as number;
  }

  // ── Streak calculation ───────────────────────────────────────────────────────
  const today      = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday  = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date(today); twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const last       = user.lastCheckInDate ? new Date(user.lastCheckInDate) : null;
  last?.setHours(0, 0, 0, 0);

  let newStreak: number;
  if (!last) {
    newStreak = 1;
  } else if (last.getTime() === yesterday.getTime()) {
    newStreak = prevStreak + 1;
  } else if (last.getTime() === today.getTime()) {
    newStreak = prevStreak; // already checked in today
  } else if (
    last.getTime() === twoDaysAgo.getTime() &&
    (user.streakFreezes ?? 0) > 0
  ) {
    // Auto-apply streak freeze: exactly one missed day, freeze available
    newStreak = prevStreak + 1;
    freezeUsed = true;
    freezeUpdates.streakFreezes = Math.max(0, (user.streakFreezes ?? 0) - 1);
  } else {
    newStreak = 1; // streak broken
  }

  const streakBonus = newStreak > 0 && newStreak % 7 === 0;

  // ── XP calculation ───────────────────────────────────────────────────────────
  const xpGained = checkInXP({
    compliance: checkInData.compliance,
    workoutCompleted: checkInData.workoutCompleted,
    steps: checkInData.steps,
    streakBonus,
  });
  const newXP    = prevXP + xpGained;
  const newLevel = levelFromXP(newXP);
  const leveledUp = newLevel > prevLevel;

  // ── Badge evaluation ─────────────────────────────────────────────────────────
  const newBadges: string[] = [];

  const [totalCheckIns, totalWorkouts, stepsAbove10k, recentCompliance] = await Promise.all([
    DailyCheckIn.countDocuments({ userId }),
    DailyCheckIn.countDocuments({ userId, workoutCompleted: true }),
    DailyCheckIn.countDocuments({ userId, steps: { $gte: 10000 } }),
    DailyCheckIn.find({ userId }).sort({ date: -1 }).limit(7).lean(),
  ]);

  function earn(id: string) {
    if (!prevBadges.has(id) && BADGE_MAP[id]) {
      newBadges.push(id);
      prevBadges.add(id);
    }
  }

  if (totalCheckIns === 1)            earn("first_checkin");
  if (newStreak >= 3)                 earn("streak_3");
  if (newStreak >= 7)                 earn("streak_7");
  if (newStreak >= 14)                earn("streak_14");
  if (newStreak >= 30)                earn("streak_30");
  if (checkInData.compliance === 10)  earn("compliance_10");
  if (recentCompliance.length === 7 && recentCompliance.every((c) => c.compliance >= 8)) earn("compliance_week");
  if (totalWorkouts >= 1)             earn("workout_1");
  if (totalWorkouts >= 10)            earn("workout_10");
  if (totalWorkouts >= 30)            earn("workout_30");
  if ((checkInData.steps ?? 0) >= 10000) earn("steps_10k");
  if (stepsAbove10k >= 5)             earn("steps_5x");
  if (newLevel >= 5)                  earn("level_5");
  if (newLevel >= 10)                 earn("level_10");

  const startWeight = user.startingWeightLbs ?? checkInData.weightLbs;
  const lostLbs     = startWeight - checkInData.weightLbs;
  if (lostLbs >= 1)  earn("loss_1lb");
  if (lostLbs >= 5)  earn("loss_5lb");
  if (lostLbs >= 10) earn("loss_10lb");

  const badgeXP    = newBadges.reduce((s, id) => s + (BADGE_MAP[id]?.xpReward ?? 0), 0);
  const totalNewXP = newXP + badgeXP;

  // ── Persist ─────────────────────────────────────────────────────────────────
  await User.findByIdAndUpdate(userId, {
    xp: totalNewXP,
    // xpSpendable accrues 1:1 with earned XP (badge XP included); quest XP handled separately
    $inc: { xpSpendable: xpGained + badgeXP },
    currentStreak: newStreak,
    longestStreak: Math.max(user.longestStreak ?? 0, newStreak),
    lastCheckInDate: today,
    earnedBadges: [...prevBadges],
    ...(totalCheckIns === 1 && { startingWeightLbs: checkInData.weightLbs }),
    ...freezeUpdates,
  });

  // ── Quest evaluation (lazy, on check-in) ───────────────────────────────────
  await getOrAssignQuests(userId);
  const completedQuests = await evaluateQuestsDetailed(userId);

  return { xpGained: xpGained + badgeXP, newBadges, newStreak, leveledUp, newLevel, freezeUsed, completedQuests };
}

/**
 * Called on the first food log entry of the day (today only).
 * Advances the streak if no check-in has been recorded for today yet —
 * so food logging counts as "showing up" when the formal check-in is skipped.
 * Idempotent: subsequent food logs the same day are no-ops.
 */
export async function awardFoodLog(userId: string, date: string): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const entryDate = new Date(date + "T00:00:00.000Z");

  // Only act on today's logs
  if (entryDate.getTime() !== today.getTime()) return;

  const user = await User.findById(userId).select(
    "currentStreak longestStreak lastCheckInDate streakFreezes lastFreezeGrantMonth xp xpSpendable"
  );
  if (!user) return;

  // Skip if a formal check-in already handled today's streak
  const lastCI = user.lastCheckInDate ? new Date(user.lastCheckInDate) : null;
  lastCI?.setHours(0, 0, 0, 0);
  if (lastCI?.getTime() === today.getTime()) return;

  // Skip if this isn't the first food log today (avoid re-running on every entry)
  const todayLogCount = await FoodLogEntry.countDocuments({ userId, date });
  if (todayLogCount > 1) return;

  const prevStreak = user.currentStreak ?? 0;
  const yesterday  = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date(today); twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  let newStreak: number;
  let freezeUsed = false;
  const freezeUpdates: Record<string, unknown> = {};

  if (!lastCI) {
    newStreak = 1;
  } else if (lastCI.getTime() === yesterday.getTime()) {
    newStreak = prevStreak + 1;
  } else if (
    lastCI.getTime() === twoDaysAgo.getTime() &&
    (user.streakFreezes ?? 0) > 0
  ) {
    newStreak = prevStreak + 1;
    freezeUsed = true;
    freezeUpdates.streakFreezes = Math.max(0, (user.streakFreezes ?? 0) - 1);
  } else {
    newStreak = 1;
  }

  // Monthly free freeze grant
  const nowMonth = new Date().toISOString().slice(0, 7);
  if (user.lastFreezeGrantMonth !== nowMonth && (user.streakFreezes ?? 0) < 2) {
    freezeUpdates.streakFreezes = ((freezeUpdates.streakFreezes as number | undefined) ?? (user.streakFreezes ?? 0)) + 1;
    freezeUpdates.lastFreezeGrantMonth = nowMonth;
  }

  void freezeUsed; // streak freeze is applied silently; no celebration overlay here

  await User.findByIdAndUpdate(userId, {
    currentStreak: newStreak,
    longestStreak: Math.max(user.longestStreak ?? 0, newStreak),
    lastCheckInDate: today,
    ...freezeUpdates,
  });
}
