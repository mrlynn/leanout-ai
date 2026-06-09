import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAdminStats } from "@/lib/adminStats";

function isAdmin(email?: string | null) {
  return email && email === process.env.ADMIN_EMAIL;
}

export async function GET() {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const stats = await getAdminStats();
  return NextResponse.json(stats, {
    headers: { "Cache-Control": "private, max-age=300, stale-while-revalidate=60" },
  });
}
