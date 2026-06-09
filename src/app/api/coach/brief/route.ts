import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { buildCoachingSnapshot, generateCoachBrief } from "@/lib/coachingContext";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const snapshot = await buildCoachingSnapshot(session.user.id);
  if (!snapshot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const brief = generateCoachBrief(snapshot);
  return NextResponse.json({ brief });
}
