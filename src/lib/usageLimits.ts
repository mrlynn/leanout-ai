import { connectDB } from "./mongodb";
import AppConfig from "@/models/AppConfig";
import User from "@/models/User";
import UserUsage, { type UsageFeature, type UsagePeriod } from "@/models/UserUsage";
import { isProActive, type PlanTier } from "./billing";

function periodKey(period: UsagePeriod): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return period === "monthly" ? `${y}-${m}` : `${y}-${m}-${d}`;
}

export interface LimitConfig {
  mealPlansPerMonth: number;
  photoLogsPerDay: number;
  voiceLogsPerDay: number;
  coachMessagesPerDay: number;
  workoutGenerationsPerMonth: number;
}

interface LimitsCache {
  free: LimitConfig;
  pro: LimitConfig;
}

let limitsCache: LimitsCache | null = null;
let limitsCacheExpiry = 0;
const LIMITS_CACHE_TTL_MS = 60_000;

export function invalidateLimitsCache() {
  limitsCache = null;
  limitsCacheExpiry = 0;
}

function normalizeLimits(raw: Partial<LimitConfig> | undefined, defaults: LimitConfig): LimitConfig {
  return {
    mealPlansPerMonth: raw?.mealPlansPerMonth ?? defaults.mealPlansPerMonth,
    photoLogsPerDay: raw?.photoLogsPerDay ?? defaults.photoLogsPerDay,
    voiceLogsPerDay: raw?.voiceLogsPerDay ?? defaults.voiceLogsPerDay,
    coachMessagesPerDay: raw?.coachMessagesPerDay ?? defaults.coachMessagesPerDay,
    workoutGenerationsPerMonth: raw?.workoutGenerationsPerMonth ?? defaults.workoutGenerationsPerMonth,
  };
}

const FREE_DEFAULTS: LimitConfig = {
  mealPlansPerMonth: 2,
  photoLogsPerDay: 5,
  voiceLogsPerDay: 5,
  coachMessagesPerDay: 10,
  workoutGenerationsPerMonth: 1,
};

const PRO_DEFAULTS: LimitConfig = {
  mealPlansPerMonth: 0,
  photoLogsPerDay: 50,
  voiceLogsPerDay: 50,
  coachMessagesPerDay: 0,
  workoutGenerationsPerMonth: 10,
};

/** Returns free and pro limits from DB. */
export async function getAllLimits(): Promise<LimitsCache> {
  const now = Date.now();
  if (limitsCache && now < limitsCacheExpiry) {
    return limitsCache;
  }

  await connectDB();
  let config = await AppConfig.findOne().lean();
  if (!config) {
    const created = await AppConfig.create({});
    config = created.toObject();
  }

  limitsCache = {
    free: normalizeLimits(config!.limits, FREE_DEFAULTS),
    pro: normalizeLimits(config!.proLimits, PRO_DEFAULTS),
  };
  limitsCacheExpiry = now + LIMITS_CACHE_TTL_MS;
  return limitsCache;
}

/** Returns limits for a tier (back-compat: getLimits = free tier). */
export async function getLimits(tier: PlanTier = "free"): Promise<LimitConfig> {
  const all = await getAllLimits();
  return tier === "pro" ? all.pro : all.free;
}

/** Maps a feature to its limit key and period. */
function featureMeta(feature: UsageFeature): { limitKey: keyof LimitConfig; period: UsagePeriod } {
  switch (feature) {
    case "meal_plan":      return { limitKey: "mealPlansPerMonth",    period: "monthly" };
    case "photo_log":      return { limitKey: "photoLogsPerDay",      period: "daily" };
    case "voice_log":      return { limitKey: "voiceLogsPerDay",      period: "daily" };
    case "coach_message":      return { limitKey: "coachMessagesPerDay",      period: "daily" };
    case "workout_generation": return { limitKey: "workoutGenerationsPerMonth", period: "monthly" };
  }
}

export interface UsageStatus {
  allowed: boolean;
  used: number;
  limit: number;
  period: UsagePeriod;
  tier: PlanTier;
  /** Call this after the actual AI call succeeds to record usage. */
  record: () => Promise<void>;
}

/**
 * Check whether a user is within their limit for a feature.
 * Resolves tier from User subscription state.
 */
export async function checkUsage(
  userId: string,
  feature: UsageFeature
): Promise<UsageStatus> {
  await connectDB();
  const user = await User.findById(userId).select("planTier subscriptionStatus").lean();
  const tier: PlanTier = isProActive(user?.planTier, user?.subscriptionStatus) ? "pro" : "free";
  const limits = await getLimits(tier);
  const { limitKey, period } = featureMeta(feature);
  const limit = limits[limitKey];
  const key = periodKey(period);

  const doc = await UserUsage.findOne({ userId, feature, period, periodKey: key }).lean();
  const used = doc?.count ?? 0;
  const allowed = limit === 0 || used < limit;

  const record = async () => {
    await UserUsage.findOneAndUpdate(
      { userId, feature, period, periodKey: key },
      { $inc: { count: 1 } },
      { upsert: true }
    );
  };

  return { allowed, used, limit, period, tier, record };
}

const FEATURE_LABELS: Record<UsageFeature, string> = {
  meal_plan: "Meal plans",
  photo_log: "Photo logs",
  voice_log: "Voice logs",
  coach_message: "Coach messages",
  workout_generation: "Workout plans",
};

/** Get usage counts and limits for display. */
export async function getUserUsageSummary(userId: string) {
  await connectDB();
  const user = await User.findById(userId).select("planTier subscriptionStatus").lean();
  const tier: PlanTier = isProActive(user?.planTier, user?.subscriptionStatus) ? "pro" : "free";
  const limits = await getLimits(tier);

  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const todayKey = `${y}-${m}-${d}`;
  const monthKey = `${y}-${m}`;

  const docs = await UserUsage.find({
    userId,
    $or: [
      { period: "daily",   periodKey: todayKey },
      { period: "monthly", periodKey: monthKey },
    ],
  }).lean();

  const get = (feature: UsageFeature) =>
    docs.find((doc) => doc.feature === feature)?.count ?? 0;

  const features: UsageFeature[] = [
    "meal_plan",
    "photo_log",
    "voice_log",
    "coach_message",
    "workout_generation",
  ];

  return {
    tier,
    items: features.map((feature) => {
      const { limitKey, period } = featureMeta(feature);
      const limit = limits[limitKey];
      const used = get(feature);
      return {
        feature,
        label: FEATURE_LABELS[feature],
        used,
        limit,
        period,
        unlimited: limit === 0,
      };
    }),
  };
}
