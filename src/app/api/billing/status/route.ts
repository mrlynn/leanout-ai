import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { isBillingEnabled, isProActive, PRICING } from "@/lib/billing";
import { getUserUsageSummary } from "@/lib/usageLimits";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const user = await User.findById(session.user.id)
    .select("planTier subscriptionStatus currentPeriodEnd stripeCustomerId")
    .lean();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const isPro = isProActive(user.planTier, user.subscriptionStatus);
  const usage = await getUserUsageSummary(session.user.id);

  return NextResponse.json({
    billingEnabled: isBillingEnabled(),
    planTier: isPro ? "pro" : "free",
    subscriptionStatus: user.subscriptionStatus,
    currentPeriodEnd: user.currentPeriodEnd,
    hasBillingAccount: !!user.stripeCustomerId,
    pricing: {
      monthly: PRICING.monthlyAmount / 100,
      annual: PRICING.annualAmount / 100,
      trialDays: PRICING.trialDays,
    },
    usage,
  });
}
