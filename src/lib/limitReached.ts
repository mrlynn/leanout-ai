import { connectDB } from "./mongodb";
import LimitReachedEvent from "@/models/LimitReachedEvent";
import type { UsageFeature } from "@/models/UserUsage";

export async function logLimitReached(userId: string, feature: UsageFeature) {
  try {
    await connectDB();
    await LimitReachedEvent.create({ userId, feature });
  } catch {
    // non-blocking analytics
  }
}
