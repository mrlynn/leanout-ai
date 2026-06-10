import { NextRequest, NextResponse } from "next/server";
import { runMonitoredHealthCheck } from "@/lib/healthMonitor";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshot = await runMonitoredHealthCheck({
    probeProviders: true,
    source: "cron",
  });

  return NextResponse.json(snapshot, { status: snapshot.ok ? 200 : 503 });
}
