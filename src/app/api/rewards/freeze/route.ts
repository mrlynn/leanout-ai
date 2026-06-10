import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

const FREEZE_COST = 200; // XP
const FREEZE_MAX  = 2;

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findById(session.user.id).select("xpSpendable streakFreezes");
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const current = user.streakFreezes ?? 0;
  const spendable = user.xpSpendable ?? 0;

  if (current >= FREEZE_MAX) {
    return NextResponse.json({ error: "Already at maximum streak freezes (2)" }, { status: 400 });
  }
  if (spendable < FREEZE_COST) {
    return NextResponse.json(
      { error: `Not enough XP. Need ${FREEZE_COST}, have ${spendable}` },
      { status: 400 }
    );
  }

  const updated = await User.findByIdAndUpdate(
    session.user.id,
    {
      $inc: { xpSpendable: -FREEZE_COST, streakFreezes: 1 },
    },
    { new: true }
  ).select("xpSpendable streakFreezes");

  return NextResponse.json({
    streakFreezes: updated?.streakFreezes ?? 0,
    xpSpendable: updated?.xpSpendable ?? 0,
  });
}
