import { connectDB } from "./mongodb";
import AppConfig from "@/models/AppConfig";
import { sendEmail, emailShell } from "./email";
import { getSystemHealth, type SystemHealthReport } from "./systemHealth";

export interface HealthSnapshot {
  ok: boolean;
  checkedAt: string;
  mongodb: string;
  missingEnv: string[];
  providerFailures: { name: string; error?: string }[];
  source: "cron" | "manual";
}

function toSnapshot(health: SystemHealthReport, source: HealthSnapshot["source"]): HealthSnapshot {
  const missingEnv = Object.entries(health.checks.env)
    .filter(([, check]) => check.required && check.status === "missing")
    .map(([key]) => key);

  const providerFailures: HealthSnapshot["providerFailures"] = [];
  if (health.checks.providers) {
    for (const [name, check] of Object.entries(health.checks.providers)) {
      if (check.status !== "ok") {
        providerFailures.push({ name, error: check.error });
      }
    }
  }

  return {
    ok: health.ok,
    checkedAt: health.checkedAt,
    mongodb: health.checks.mongodb.status,
    missingEnv,
    providerFailures,
    source,
  };
}

function buildAlertBody(snapshot: HealthSnapshot, kind: "down" | "recovered"): string {
  if (kind === "recovered") {
    return emailShell(
      "System recovered",
      `<p style="margin:0 0 12px;color:#374151;">All health checks passed at <strong>${snapshot.checkedAt}</strong>.</p>`
    );
  }

  const issues: string[] = [];
  if (snapshot.mongodb !== "ok") issues.push(`MongoDB: ${snapshot.mongodb}`);
  if (snapshot.missingEnv.length) issues.push(`Missing env: ${snapshot.missingEnv.join(", ")}`);
  for (const p of snapshot.providerFailures) {
    issues.push(`${p.name}: ${p.error ?? "failed"}`);
  }

  return emailShell(
    "System health alert",
    `<p style="margin:0 0 12px;color:#374151;">LeanOut AI health checks failed at <strong>${snapshot.checkedAt}</strong>.</p>
     <ul style="margin:0;padding-left:20px;color:#374151;">${issues.map((i) => `<li>${i}</li>`).join("")}</ul>
     <p style="margin:16px 0 0;color:#6b7280;font-size:14px;">Open the admin panel → Overview → System health for details.</p>`
  );
}

async function maybeSendAlert(
  previousOk: boolean | undefined,
  snapshot: HealthSnapshot
): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  if (previousOk === true && !snapshot.ok) {
    await sendEmail({
      to: adminEmail,
      subject: "[LeanOut AI] System health alert",
      html: buildAlertBody(snapshot, "down"),
    });
    return;
  }

  if (previousOk === false && snapshot.ok) {
    await sendEmail({
      to: adminEmail,
      subject: "[LeanOut AI] System recovered",
      html: buildAlertBody(snapshot, "recovered"),
    });
  }
}

export async function runMonitoredHealthCheck(options?: {
  probeProviders?: boolean;
  source?: HealthSnapshot["source"];
}): Promise<HealthSnapshot> {
  const health = await getSystemHealth({
    includeAdminEnv: true,
    probeProviders: options?.probeProviders ?? true,
  });
  const snapshot = toSnapshot(health, options?.source ?? "cron");

  await connectDB();
  const existing = await AppConfig.findOne().select("lastHealthCheck").lean();
  const previousOk = existing?.lastHealthCheck?.ok;

  await AppConfig.findOneAndUpdate(
    {},
    { $set: { lastHealthCheck: snapshot } },
    { upsert: true }
  );

  if (snapshot.ok) {
    console.log(`[health] ok source=${snapshot.source} checkedAt=${snapshot.checkedAt}`);
  } else {
    console.error(`[health] fail source=${snapshot.source} snapshot=${JSON.stringify(snapshot)}`);
  }

  await maybeSendAlert(previousOk, snapshot);
  return snapshot;
}

export async function getLastHealthSnapshot(): Promise<HealthSnapshot | null> {
  await connectDB();
  const config = await AppConfig.findOne().select("lastHealthCheck").lean();
  return config?.lastHealthCheck ?? null;
}
