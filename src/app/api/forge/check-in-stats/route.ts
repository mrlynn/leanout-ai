import { NextRequest, NextResponse } from "next/server";
import { getForgeCheckInStats } from "@/lib/forgeCheckInStats";

function authorize(req: NextRequest): boolean {
  const expected = process.env.FORGE_API_KEY;
  if (!expected) return false;

  const headerKey = req.headers.get("x-leanout-forge-key");
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return headerKey === expected || bearer === expected;
}

export async function GET(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = req.nextUrl.searchParams.get("email")?.trim();
  if (!email) {
    return NextResponse.json({ error: "email query parameter is required" }, { status: 400 });
  }

  const stats = await getForgeCheckInStats(email);
  if (!stats) {
    return NextResponse.json({ error: "User not found", email }, { status: 404 });
  }

  return NextResponse.json(stats);
}
