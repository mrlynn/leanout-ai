import type { HealthPlugin } from "@capgo/capacitor-health";
import { healthSyncBlockedMessage, isNativeApp } from "./nativeBridge";

const HEALTH_CALL_TIMEOUT_MS = 20_000;
const AUTH_PROMPT_TIMEOUT_MS = 15_000;
const API_TIMEOUT_MS = 20_000;

export type HealthSource = "apple_health" | "health_connect" | "manual";

export interface TodayHealthMetrics {
  steps?: number;
  weightLbs?: number;
  source: HealthSource;
  syncedAt: string;
}

function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

function todayStartIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function healthSource(): HealthSource {
  if (typeof navigator === "undefined") return "manual";
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) ? "apple_health" : "health_connect";
}

function formatSyncedSummary(metrics: TodayHealthMetrics): string {
  const parts: string[] = [];
  if (metrics.steps !== undefined) parts.push(`${metrics.steps.toLocaleString()} steps`);
  if (metrics.weightLbs !== undefined) parts.push(`${metrics.weightLbs} lbs`);
  return parts.length ? `Synced ${parts.join(" · ")}` : "Synced from health app";
}

function healthTimeoutMessage(label: string): string {
  if (label.includes("permission")) {
    return "Health permission prompt did not respond. Open Settings → Health → LeanOut, enable Steps and Weight, then sync again.";
  }
  return "Health sync timed out. Force-quit LeanOut, reopen it, and try again.";
}

async function withTimeout<T>(label: string, promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function getHealthPlugin(): Promise<HealthPlugin | null> {
  if (!isNativeApp()) return null;
  try {
    const { Health } = await withTimeout(
      "Health plugin load",
      import("@capgo/capacitor-health"),
      HEALTH_CALL_TIMEOUT_MS
    );
    return Health;
  } catch {
    return null;
  }
}

export async function isHealthPlatformAvailable(): Promise<boolean> {
  const Health = await getHealthPlugin();
  if (!Health) return false;
  try {
    const result = await withTimeout("Health availability", Health.isAvailable(), HEALTH_CALL_TIMEOUT_MS);
    return !!result.available;
  } catch {
    return false;
  }
}

/**
 * Show the Health permission sheet if needed. On iOS, readAuthorized is often
 * empty even after the user allows access — callers must still attempt readSamples.
 */
export async function requestHealthAccess(): Promise<{ ok: boolean; message?: string }> {
  if (!isNativeApp()) {
    return { ok: false, message: healthSyncBlockedMessage() };
  }

  const Health = await getHealthPlugin();
  if (!Health) {
    return {
      ok: false,
      message: "Health plugin not loaded. Rebuild the app from mobile/ (npx cap sync ios).",
    };
  }

  try {
    const available = await withTimeout(
      "Health availability",
      Health.isAvailable(),
      HEALTH_CALL_TIMEOUT_MS
    );
    if (!available.available) {
      return {
        ok: false,
        message: available.reason ?? "Health data is not available on this device.",
      };
    }

    const status = await withTimeout(
      "Health authorization check",
      Health.checkAuthorization({ read: ["steps", "weight"], write: [] }),
      HEALTH_CALL_TIMEOUT_MS
    );

    const needsPrompt =
      status.readDenied.includes("steps") || status.readDenied.includes("weight");

    if (needsPrompt) {
      await withTimeout(
        "Health permission request",
        Health.requestAuthorization({ read: ["steps", "weight"], write: [] }),
        AUTH_PROMPT_TIMEOUT_MS
      );
    }

    return { ok: true };
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Health permission request failed";
    if (detail.includes("timed out")) {
      return { ok: false, message: healthTimeoutMessage(detail) };
    }
    return { ok: false, message: detail };
  }
}

async function readSamplesFromHealth(Health: HealthPlugin): Promise<TodayHealthMetrics | null> {
  const available = await withTimeout(
    "Health availability",
    Health.isAvailable(),
    HEALTH_CALL_TIMEOUT_MS
  );
  if (!available.available) return null;

  const now = new Date().toISOString();
  const start = todayStartIso();

  let steps: number | undefined;
  let weightLbs: number | undefined;

  const stepsResult = await withTimeout(
    "Health steps read",
    Health.readSamples({
      dataType: "steps",
      startDate: start,
      endDate: now,
      limit: 200,
    }),
    HEALTH_CALL_TIMEOUT_MS
  );
  if (stepsResult.samples?.length) {
    steps = Math.round(stepsResult.samples.reduce((sum, s) => sum + (s.value ?? 0), 0));
  }

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const weightResult = await withTimeout(
    "Health weight read",
    Health.readSamples({
      dataType: "weight",
      startDate: weekAgo,
      endDate: now,
      limit: 20,
      ascending: false,
    }),
    HEALTH_CALL_TIMEOUT_MS
  );
  const latestWeight = weightResult.samples?.[0];
  if (latestWeight?.value != null) {
    weightLbs = kgToLbs(latestWeight.value);
  }

  if (steps === undefined && weightLbs === undefined) return null;

  return {
    steps,
    weightLbs,
    source: healthSource(),
    syncedAt: now,
  };
}

/** Read today's steps and most recent weight from HealthKit / Health Connect. */
export async function readTodayMetrics(): Promise<TodayHealthMetrics | null> {
  const Health = await getHealthPlugin();
  if (!Health) return null;

  try {
    return await readSamplesFromHealth(Health);
  } catch {
    return null;
  }
}

export async function syncHealthToBackend(): Promise<{
  ok: boolean;
  message: string;
  metrics?: TodayHealthMetrics;
}> {
  if (!isNativeApp()) {
    return { ok: false, message: healthSyncBlockedMessage() };
  }

  const Health = await getHealthPlugin();
  if (!Health) {
    return {
      ok: false,
      message: "Health plugin not loaded. Rebuild the app from mobile/ (npx cap sync ios).",
    };
  }

  // Read first — avoids re-opening the permission sheet on every sync when access is already granted.
  let metrics: TodayHealthMetrics | null = null;
  try {
    metrics = await readSamplesFromHealth(Health);
  } catch (err) {
    const detail = err instanceof Error ? err.message : "";
    if (detail.includes("timed out")) {
      return { ok: false, message: healthTimeoutMessage(detail) };
    }
  }

  if (!metrics) {
    const access = await requestHealthAccess();
    if (!access.ok) {
      return { ok: false, message: access.message ?? "Could not access Health." };
    }

    try {
      metrics = await readSamplesFromHealth(Health);
    } catch (err) {
      const detail = err instanceof Error ? err.message : "";
      if (detail.includes("timed out")) {
        return { ok: false, message: healthTimeoutMessage(detail) };
      }
    }
  }

  if (!metrics) {
    return {
      ok: false,
      message:
        "No steps or weight found. In the Health app, open Sharing → Apps → LeanOut and enable Steps and Weight.",
    };
  }

  let res: Response;
  try {
    res = await fetch("/api/user/health-sync", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
      body: JSON.stringify({
        steps: metrics.steps,
        weightLbs: metrics.weightLbs,
        source: metrics.source,
      }),
    });
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      return { ok: false, message: "Server timed out — try again in a moment." };
    }
    return { ok: false, message: "Network error — check your connection and try again." };
  }

  let data: { error?: string } = {};
  try {
    data = await res.json();
  } catch {
    return { ok: false, message: `Server error (${res.status}). Try again in a moment.` };
  }

  if (!res.ok) {
    return { ok: false, message: data.error ?? "Sync failed" };
  }

  return {
    ok: true,
    message: formatSyncedSummary(metrics),
    metrics,
  };
}
