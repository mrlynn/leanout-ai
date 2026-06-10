import { NextResponse } from "next/server";
import { getSystemHealth } from "@/lib/systemHealth";

/** Lightweight health check — no auth, no live AI probes. Safe for uptime monitors. */
export async function GET() {
  const health = await getSystemHealth();
  const missingEnv = Object.entries(health.checks.env)
    .filter(([, check]) => check.required && check.status === "missing")
    .map(([key]) => key);

  return NextResponse.json(
    {
      ok: health.ok,
      checkedAt: health.checkedAt,
      mongodb: health.checks.mongodb.status,
      missingEnv,
      monitorUrl: "/api/health",
    },
    {
      status: health.ok ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
