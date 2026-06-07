import User from "@/models/User";
import DailyCheckIn from "@/models/DailyCheckIn";
import { checkInXP, levelFromXP, BADGE_MAP } from "./gamification";

interface AwardResult {
  xpGained: number;
  newBadges: string[];
  newStreak: number;
  leveledUp: boolean;
  newLevel: number;
}

export async function awardCheckIn(userId: string, checkInData: {
  compliance: number;
  workoutCompleted: boolean;
  steps?: number;
  weightLbs: number;
}): Promise<AwardResult> {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const prevXP     = user.xp ?? 0;
  const prevBadges = new Set<string>(user.earnedBadges ?? []);
  const prevStreak = user.currentStreak ?? 0;
  const prevLevel  = levelFromXP(prevXP);

  // ── Streak calculation ──────────────────────────────────────────
  const today     = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const last      = user.lastCheckInDate ? new Date(user.lastCheckInDate) : null;
  last?.setHours(0, 0, 0, 0);

  let newStreak: number;
  if (!last) {
    newStreak = 1;
  } else if (last.getTime() === yesterday.getTime()) {
    newStreak = prevStreak + 1;
  } else if (last.getTime() === today.getTime()) {
    newStreak = prevStreak; // already checked in today, no change
  } else {
    newStreak = 1; // streak broken
  }

  const streakBonus = newStreak > 0 && newStreak % 7 === 0;

  // ── XP calculation ──────────────────────────────────────────────
  const xpGained = checkInXP({
    compliance: checkInData.compliance,
    workoutCompleted: checkInData.workoutCompleted,
    steps: checkInData.steps,
    streakBonus,
  });
  const newXP    = prevXP + xpGained;
  const newLevel = levelFromXP(newXP);
  const leveledUp = newLevel > prevLevel;

  // ── Badge evaluation ────────────────────────────────────────────
  const newBadges: string[] = [];

  // Pull aggregate stats for badge checks
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

  // Weight-loss badges (compare to starting weight)
  const startWeight = user.startingWeightLbs ?? checkInData.weightLbs;
  const lostLbs     = startWeight - checkInData.weightLbs;
  if (lostLbs >= 1)  earn("loss_1lb");
  if (lostLbs >= 5)  earn("loss_5lb");
  if (lostLbs >= 10) earn("loss_10lb");

  // XP from badge rewards
  const badgeXP    = newBadges.reduce((s, id) => s + (BADGE_MAP[id]?.xpReward ?? 0), 0);
  const totalNewXP = newXP + badgeXP;

  // ── Persist ─────────────────────────────────────────────────────
  await User.findByIdAndUpdate(userId, {
    xp: totalNewXP,
    currentStreak: newStreak,
    longestStreak: Math.max(user.longestStreak ?? 0, newStreak),
    lastCheckInDate: today,
    earnedBadges: [...prevBadges],
    ...(totalCheckIns === 1 && { startingWeightLbs: checkInData.weightLbs }),
  });

  return { xpGained: xpGained + badgeXP, newBadges, newStreak, leveledUp, newLevel };
}
