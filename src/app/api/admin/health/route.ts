import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSystemHealth } from "@/lib/systemHealth";
import { getLastHealthSnapshot, runMonitoredHealthCheck } from "@/lib/healthMonitor";

function isAdmin(email?: string | null) {
  return email && email === process.env.ADMIN_EMAIL;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const probe = req.nextUrl.searchParams.get("probe") === "true";
  const persist = req.nextUrl.searchParams.get("persist") === "true";

  if (probe && persist) {
    const snapshot = await runMonitoredHealthCheck({ probeProviders: true, source: "manual" });
    const health = await getSystemHealth({ includeAdminEnv: true, probeProviders: true });
    return NextResponse.json(
      { ...health, lastAutomatedCheck: snapshot },
      { status: health.ok ? 200 : 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  const [health, lastAutomatedCheck] = await Promise.all([
    getSystemHealth({ includeAdminEnv: true, probeProviders: probe }),
    getLastHealthSnapshot(),
  ]);

  return NextResponse.json(
    { ...health, lastAutomatedCheck },
    {
      status: health.ok ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
