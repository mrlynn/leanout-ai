import { isNativeApp } from "./nativeBridge";

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

async function getHealthPlugin() {
  if (!isNativeApp()) return null;
  try {
    const { Health } = await import("@capgo/capacitor-health");
    return Health;
  } catch {
    return null;
  }
}

export async function isHealthPlatformAvailable(): Promise<boolean> {
  const Health = await getHealthPlugin();
  if (!Health) return false;
  try {
    const result = await Health.isAvailable();
    return !!result.available;
  } catch {
    return false;
  }
}

export async function requestHealthAccess(): Promise<boolean> {
  const Health = await getHealthPlugin();
  if (!Health) return false;
  try {
    const available = await Health.isAvailable();
    if (!available.available) return false;
    await Health.requestAuthorization({
      read: ["steps", "weight"],
      write: [],
    });
    const status = await Health.checkAuthorization({ read: ["steps", "weight"] });
    return status.readAuthorized.length > 0;
  } catch {
    return false;
  }
}

/** Read today's steps and most recent weight from HealthKit / Health Connect. */
export async function readTodayMetrics(): Promise<TodayHealthMetrics | null> {
  const Health = await getHealthPlugin();
  if (!Health) return null;

  try {
    const available = await Health.isAvailable();
    if (!available.available) return null;

    const now = new Date().toISOString();
    const start = todayStartIso();

    let steps: number | undefined;
    let weightLbs: number | undefined;

    const stepsResult = await Health.readSamples({
      dataType: "steps",
      startDate: start,
      endDate: now,
      limit: 500,
    });
    if (stepsResult.samples?.length) {
      steps = Math.round(
        stepsResult.samples.reduce((sum, s) => sum + (s.value ?? 0), 0)
      );
    }

    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const weightResult = await Health.readSamples({
      dataType: "weight",
      startDate: weekAgo,
      endDate: now,
      limit: 20,
      ascending: false,
    });
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
  } catch {
    return null;
  }
}

export async function syncHealthToBackend(): Promise<{
  ok: boolean;
  message: string;
  metrics?: TodayHealthMetrics;
}> {
  const granted = await requestHealthAccess();
  if (!granted) {
    return {
      ok: false,
      message: isNativeApp()
        ? "Health permissions denied. Enable in Settings → Health."
        : "Install the LeanOut mobile app to sync Apple Health or Health Connect.",
    };
  }

  const metrics = await readTodayMetrics();
  if (!metrics) {
    return { ok: false, message: "No health data found for today." };
  }

  const res = await fetch("/api/user/health-sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      steps: metrics.steps,
      weightLbs: metrics.weightLbs,
      source: metrics.source,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    return { ok: false, message: data.error ?? "Sync failed" };
  }

  return {
    ok: true,
    message: "Synced from health app",
    metrics,
  };
}
