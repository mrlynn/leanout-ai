import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getLastHealthSnapshot } from "@/lib/healthMonitor";

function isAdmin(email?: string | null) {
  return email && email === process.env.ADMIN_EMAIL;
}

export async function GET() {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const snapshot = await getLastHealthSnapshot();
  if (!snapshot) {
    return NextResponse.json({
      ok: null,
      checkedAt: null,
      source: null,
      ageMinutes: null,
      message: "No automated health check has run yet",
    });
  }

  const ageMinutes = Math.round(
    (Date.now() - new Date(snapshot.checkedAt).getTime()) / 60_000
  );

  return NextResponse.json({
    ok: snapshot.ok,
    checkedAt: snapshot.checkedAt,
    source: snapshot.source,
    ageMinutes,
    mongodb: snapshot.mongodb,
    missingEnv: snapshot.missingEnv,
    providerFailures: snapshot.providerFailures,
  });
}
