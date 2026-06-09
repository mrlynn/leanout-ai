import User from "@/models/User";
import { xpProgress, BADGES } from "@/lib/gamification";
import { physiqueFromUser, macrosFromUser } from "@/lib/physique";

export async function getUserContext(userId: string) {
  const user = await User.findById(userId).lean();
  if (!user) return null;

  const physique = physiqueFromUser(user);
  const macros = macrosFromUser(user);

  const xp = user.xp ?? 0;
  const progress = xpProgress(xp);
  const earned = new Set(user.earnedBadges ?? []);

  return {
    macros: macros
      ? {
          calories: macros.calories,
          proteinG: macros.proteinG,
          carbsG: macros.carbsG,
          fatG: macros.fatG,
          maintenanceCalories: physique!.maintenanceCalories,
          goalType: user.goalType,
        }
      : null,
    stats: {
      weightLbs: user.weightLbs,
      bodyFatPercent: user.bodyFatPercent,
      goalWeightLbs: physique?.goalWeightLbs,
      weeksToGoal: physique?.weeksToGoal,
      goalType: user.goalType,
    },
    gamification: {
      xp,
      level: progress.level,
      xpCurrent: progress.current,
      xpNeeded: progress.needed,
      xpPct: progress.pct,
      currentStreak: user.currentStreak ?? 0,
      longestStreak: user.longestStreak ?? 0,
      badges: BADGES.map((b) => ({ ...b, earned: earned.has(b.id) })),
      earnedCount: earned.size,
      totalBadges: BADGES.length,
    },
  };
}
