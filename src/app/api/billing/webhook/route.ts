import { NextRequest, NextResponse } from "next/server";
import { getStripe, isBillingEnabled } from "@/lib/billing";
import { syncSubscriptionFromStripe, cancelSubscription } from "@/lib/subscriptionSync";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  if (!isBillingEnabled()) {
    return NextResponse.json({ received: true, skipped: true });
  }

  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ received: true, skipped: true });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    console.error("[stripe webhook] signature failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && session.subscription) {
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id;
        const sub = await stripe.subscriptions.retrieve(subId);
        await syncSubscriptionFromStripe(sub);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const sub = event.data.object as Stripe.Subscription;
      await syncSubscriptionFromStripe(sub);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      await connectDB();
      const user = await User.findOne({ stripeCustomerId: customerId });
      if (user) await cancelSubscription(user._id.toString());
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
