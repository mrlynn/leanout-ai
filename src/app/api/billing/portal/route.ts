import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { BILLING_UNAVAILABLE, getStripe, getAppUrl, isBillingEnabled } from "@/lib/billing";

export async function POST() {
  if (!isBillingEnabled()) {
    return NextResponse.json(BILLING_UNAVAILABLE, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const user = await User.findById(session.user.id).lean();
  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account" }, { status: 400 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(BILLING_UNAVAILABLE, { status: 503 });
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${getAppUrl()}/settings`,
  });

  return NextResponse.json({ url: portal.url });
}
