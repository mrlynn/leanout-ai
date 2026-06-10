#!/usr/bin/env node

import { loadEnvLocal } from "./load-env-local.mjs";

loadEnvLocal();

/**
 * Pings /api/health for uptime monitoring or local smoke tests.
 * Usage: npm run check:health
 *        HEALTH_URL=https://your-app.vercel.app/api/health npm run check:health
 */

const base = process.env.HEALTH_URL ?? `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/health`;

async function main() {
  const started = Date.now();
  let res;
  try {
    res = await fetch(base, { signal: AbortSignal.timeout(15_000) });
  } catch (err) {
    console.error(`Health check request failed: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }

  const body = await res.json().catch(() => ({}));
  const latencyMs = Date.now() - started;

  if (res.ok && body.ok) {
    console.log(`Health OK (${latencyMs}ms) — ${body.checkedAt ?? "unknown time"}`);
    process.exit(0);
  }

  console.error(`Health check failed (${res.status}, ${latencyMs}ms)`);
  console.error(JSON.stringify(body, null, 2));
  process.exit(1);
}

main();
