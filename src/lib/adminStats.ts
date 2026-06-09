import { connectDB } from "./mongodb";
import User from "@/models/User";
import FoodLogEntry from "@/models/FoodLogEntry";
import DailyCheckIn from "@/models/DailyCheckIn";
import MealPlan from "@/models/MealPlan";

let statsCache: { data: unknown; expiry: number } | null = null;
const STATS_CACHE_TTL_MS = 5 * 60 * 1000;

export function invalidateAdminStatsCache() {
  statsCache = null;
}

export async function getAdminStats() {
  const now = Date.now();
  if (statsCache && now < statsCache.expiry) {
    return statsCache.data;
  }

  await connectDB();

  const dateNow = new Date();
  const thirtyDaysAgo = new Date(dateNow.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(dateNow.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    onboardedUsers,
    newUsersLast30,
    newUsersLast7,
    totalFoodLogs,
    visionLogs,
    voiceLogs,
    manualLogs,
    planLogs,
    foodLogsLast30,
    totalCheckIns,
    checkInsLast30,
    totalMealPlans,
    mealPlansLast30,
    goalBreakdown,
    activityBreakdown,
    sexBreakdown,
    recentUsers,
    dailySignups,
    dailyFoodLogs,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ onboardingComplete: true }),
    User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    FoodLogEntry.countDocuments(),
    FoodLogEntry.countDocuments({ source: "vision" }),
    FoodLogEntry.countDocuments({ source: "voice" }),
    FoodLogEntry.countDocuments({ source: "manual" }),
    FoodLogEntry.countDocuments({ source: "meal_plan" }),
    FoodLogEntry.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    DailyCheckIn.countDocuments(),
    DailyCheckIn.countDocuments({ date: { $gte: thirtyDaysAgo } }),
    MealPlan.countDocuments(),
    MealPlan.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    User.aggregate([
      { $match: { goalType: { $exists: true } } },
      { $group: { _id: "$goalType", count: { $sum: 1 } } },
    ]),
    User.aggregate([
      { $match: { activityLevel: { $exists: true } } },
      { $group: { _id: "$activityLevel", count: { $sum: 1 } } },
    ]),
    User.aggregate([
      { $match: { sex: { $exists: true } } },
      { $group: { _id: "$sex", count: { $sum: 1 } } },
    ]),
    User.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .select("name email onboardingComplete goalType createdAt xp currentStreak lastCheckInDate")
      .lean(),
    User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    FoodLogEntry.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const estimatedCosts = {
    vision: visionLogs * 0.008,
    voice: voiceLogs * 0.003,
    mealPlans: totalMealPlans * 0.025,
  };
  const totalEstimatedCost = estimatedCosts.vision + estimatedCosts.voice + estimatedCosts.mealPlans;

  const data = {
    users: {
      total: totalUsers,
      onboarded: onboardedUsers,
      newLast30: newUsersLast30,
      newLast7: newUsersLast7,
      onboardRate: totalUsers > 0 ? Math.round((onboardedUsers / totalUsers) * 100) : 0,
    },
    foodLog: {
      total: totalFoodLogs,
      last30: foodLogsLast30,
      bySource: { vision: visionLogs, voice: voiceLogs, manual: manualLogs, meal_plan: planLogs },
    },
    checkIns: {
      total: totalCheckIns,
      last30: checkInsLast30,
    },
    mealPlans: {
      total: totalMealPlans,
      last30: mealPlansLast30,
    },
    breakdown: {
      goals: Object.fromEntries(goalBreakdown.map((g: { _id: string; count: number }) => [g._id, g.count])),
      activity: Object.fromEntries(activityBreakdown.map((a: { _id: string; count: number }) => [a._id, a.count])),
      sex: Object.fromEntries(sexBreakdown.map((s: { _id: string; count: number }) => [s._id, s.count])),
    },
    aiCosts: {
      estimated: estimatedCosts,
      total: totalEstimatedCost,
      note: "Coach (Claude Sonnet) messages not individually tracked — excluded from total.",
    },
    recentUsers,
    charts: {
      dailySignups,
      dailyFoodLogs,
    },
  };

  statsCache = { data, expiry: now + STATS_CACHE_TTL_MS };
  return data;
}
