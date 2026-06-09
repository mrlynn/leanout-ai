import type Stripe from "stripe";
import { connectDB } from "./mongodb";
import User from "@/models/User";
import { isProActive } from "./billing";

export async function syncSubscriptionFromStripe(subscription: Stripe.Subscription) {
  await connectDB();
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const user = await User.findOne({ stripeCustomerId: customerId });
  if (!user) return null;

  const status = subscription.status as
    | "active"
    | "trialing"
    | "past_due"
    | "canceled"
    | "incomplete";

  const item = subscription.items?.data?.[0];
  const periodEndUnix = item?.current_period_end;
  const periodEnd = periodEndUnix ? new Date(periodEndUnix * 1000) : undefined;
  const pro = isProActive("pro", status);

  await User.findByIdAndUpdate(user._id, {
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: status,
    ...(periodEnd ? { currentPeriodEnd: periodEnd } : {}),
    planTier: pro ? "pro" : "free",
  });

  return user._id.toString();
}

export async function cancelSubscription(userId: string) {
  await connectDB();
  await User.findByIdAndUpdate(userId, {
    planTier: "free",
    subscriptionStatus: "canceled",
    stripeSubscriptionId: null,
  });
}
