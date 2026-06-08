import { connectDB } from "./mongodb";
import AppConfig from "@/models/AppConfig";
import UserUsage, { type UsageFeature, type UsagePeriod } from "@/models/UserUsage";

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
}

/** Returns the current limits from DB, creating defaults if none exist. */
export async function getLimits(): Promise<LimitConfig> {
  await connectDB();
  let config = await AppConfig.findOne().lean();
  if (!config) {
    const created = await AppConfig.create({});
    config = created.toObject();
  }
  return config!.limits as LimitConfig;
}

/** Maps a feature to its limit key and period. */
function featureMeta(feature: UsageFeature): { limitKey: keyof LimitConfig; period: UsagePeriod } {
  switch (feature) {
    case "meal_plan":      return { limitKey: "mealPlansPerMonth",    period: "monthly" };
    case "photo_log":      return { limitKey: "photoLogsPerDay",      period: "daily" };
    case "voice_log":      return { limitKey: "voiceLogsPerDay",      period: "daily" };
    case "coach_message":  return { limitKey: "coachMessagesPerDay",  period: "daily" };
  }
}

export interface UsageStatus {
  allowed: boolean;
  used: number;
  limit: number;
  period: UsagePeriod;
  /** Call this after the actual AI call succeeds to record usage. */
  record: () => Promise<void>;
}

/**
 * Check whether a user is within their limit for a feature.
 * Returns { allowed, used, limit, record }.
 * Call record() only if the AI call succeeds.
 */
export async function checkUsage(
  userId: string,
  feature: UsageFeature
): Promise<UsageStatus> {
  await connectDB();
  const limits = await getLimits();
  const { limitKey, period } = featureMeta(feature);
  const limit = limits[limitKey];
  const key = periodKey(period);

  const doc = await UserUsage.findOne({ userId, feature, period, periodKey: key }).lean();
  const used = doc?.count ?? 0;
  const allowed = limit === 0 || used < limit; // 0 = unlimited

  const record = async () => {
    await UserUsage.findOneAndUpdate(
      { userId, feature, period, periodKey: key },
      { $inc: { count: 1 } },
      { upsert: true }
    );
  };

  return { allowed, used, limit, period, record };
}

/** Get usage counts across all features for a user (for display). */
export async function getUserUsageSummary(userId: string) {
  await connectDB();
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
    docs.find((d) => d.feature === feature)?.count ?? 0;

  return {
    meal_plan:     get("meal_plan"),
    photo_log:     get("photo_log"),
    voice_log:     get("voice_log"),
    coach_message: get("coach_message"),
  };
}
