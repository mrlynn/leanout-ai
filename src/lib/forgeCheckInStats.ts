import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import DailyCheckIn from "@/models/DailyCheckIn";
import { levelFromXP, xpProgress } from "@/lib/gamification";

export interface ForgeCheckInRow {
  date: string;
  weightLbs: number;
  compliance: number;
  energy: number;
  hunger: number;
  steps: number | null;
  workoutCompleted: boolean;
}

export interface ForgeCheckInStats {
  user: {
    name: string;
    email: string;
    goalType: string | null;
  };
  gamification: {
    xp: number;
    level: number;
    xpProgressPct: number;
    currentStreak: number;
    longestStreak: number;
  };
  latest: ForgeCheckInRow | null;
  averages7d: {
    compliance: number | null;
    energy: number | null;
    hunger: number | null;
    workouts: number;
  };
  recentCheckIns: ForgeCheckInRow[];
}

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

function toRow(c: {
  date: Date;
  weightLbs: number;
  compliance: number;
  energy: number;
  hunger: number;
  steps?: number;
  workoutCompleted?: boolean;
}): ForgeCheckInRow {
  return {
    date: c.date.toISOString().slice(0, 10),
    weightLbs: c.weightLbs,
    compliance: c.compliance,
    energy: c.energy,
    hunger: c.hunger,
    steps: c.steps ?? null,
    workoutCompleted: c.workoutCompleted ?? false,
  };
}

export async function getForgeCheckInStats(email: string): Promise<ForgeCheckInStats | null> {
  await connectDB();

  const user = await User.findOne({ email: email.toLowerCase().trim() })
    .select("name email goalType xp currentStreak longestStreak")
    .lean();

  if (!user) return null;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setHours(0, 0, 0, 0);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const checkIns = await DailyCheckIn.find({ userId: user._id })
    .sort({ date: -1 })
    .limit(14)
    .lean();

  const last7 = checkIns.filter((c) => c.date >= sevenDaysAgo);
  const xp = user.xp ?? 0;
  const progress = xpProgress(xp);

  return {
    user: {
      name: user.name,
      email: user.email,
      goalType: user.goalType ?? null,
    },
    gamification: {
      xp,
      level: levelFromXP(xp),
      xpProgressPct: progress.pct,
      currentStreak: user.currentStreak ?? 0,
      longestStreak: user.longestStreak ?? 0,
    },
    latest: checkIns[0] ? toRow(checkIns[0]) : null,
    averages7d: {
      compliance: avg(last7.map((c) => c.compliance)),
      energy: avg(last7.map((c) => c.energy)),
      hunger: avg(last7.map((c) => c.hunger)),
      workouts: last7.filter((c) => c.workoutCompleted).length,
    },
    recentCheckIns: checkIns.slice(0, 7).map(toRow),
  };
}
