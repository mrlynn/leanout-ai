import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import WeeklyReport from "@/models/WeeklyReport";
import { requirePro } from "@/lib/planTier";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const proBlock = await requirePro(session.user.id);
  if (proBlock) return proBlock;

  await connectDB();
  const reports = await WeeklyReport.find({ userId: session.user.id })
    .sort({ weekStart: -1 })
    .limit(12)
    .lean();

  return NextResponse.json({ reports });
}
