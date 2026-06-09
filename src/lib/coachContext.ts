import { buildCoachingSnapshot, buildCoachSystemPromptFromSnapshot } from "@/lib/coachingContext";

const CONTEXT_STALE_MS = 24 * 60 * 60 * 1000;

export function isCoachContextStale(updatedAt: Date) {
  return Date.now() - updatedAt.getTime() > CONTEXT_STALE_MS;
}

export async function buildCoachSystemPrompt(userId: string) {
  const snapshot = await buildCoachingSnapshot(userId);
  if (!snapshot) throw new Error("User not found");
  return buildCoachSystemPromptFromSnapshot(snapshot);
}
