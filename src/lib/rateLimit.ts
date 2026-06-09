import { connectDB } from "./mongodb";
import RateLimitEntry from "@/models/RateLimitEntry";

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean }> {
  await connectDB();
  const now = new Date();
  const entry = await RateLimitEntry.findOne({ key });

  if (!entry || now.getTime() - entry.windowStart.getTime() > windowMs) {
    await RateLimitEntry.findOneAndUpdate(
      { key },
      { count: 1, windowStart: now },
      { upsert: true }
    );
    return { allowed: true };
  }

  if (entry.count >= limit) {
    return { allowed: false };
  }

  entry.count += 1;
  await entry.save();
  return { allowed: true };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
