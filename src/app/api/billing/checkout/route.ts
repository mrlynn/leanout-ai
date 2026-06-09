import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { BILLING_UNAVAILABLE, getStripe, getAppUrl, isBillingEnabled, PRICING } from "@/lib/billing";

export async function POST(req: NextRequest) {
  if (!isBillingEnabled()) {
    return NextResponse.json(BILLING_UNAVAILABLE, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { interval } = await req.json();
  if (interval !== "monthly" && interval !== "annual") {
    return NextResponse.json({ error: "interval must be monthly or annual" }, { status: 400 });
  }

  const priceId =
    interval === "monthly"
      ? process.env.STRIPE_PRICE_MONTHLY
      : process.env.STRIPE_PRICE_ANNUAL;

  const stripe = getStripe();
  if (!stripe || !priceId) {
    return NextResponse.json(BILLING_UNAVAILABLE, { status: 503 });
  }

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const appUrl = getAppUrl();

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user._id.toString() },
    });
    customerId = customer.id;
    user.stripeCustomerId = customerId;
    await user.save();
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: PRICING.trialDays,
      metadata: { userId: user._id.toString() },
    },
    success_url: `${appUrl}/settings?billing=success`,
    cancel_url: `${appUrl}/pricing?canceled=1`,
    metadata: { userId: user._id.toString() },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
