import Stripe from "stripe";

export type PlanTier = "free" | "pro";

export const PRICING = {
  monthlyAmount: 999, // $9.99
  annualAmount: 7900, // $79.00
  trialDays: 7,
  currency: "usd",
} as const;

export const PRO_LIMIT_DEFAULTS = {
  mealPlansPerMonth: 0,
  photoLogsPerDay: 50,
  voiceLogsPerDay: 50,
  coachMessagesPerDay: 0,
  workoutGenerationsPerMonth: 10,
} as const;

export const FREE_LIMIT_DEFAULTS = {
  mealPlansPerMonth: 5,
  photoLogsPerDay: 10,
  voiceLogsPerDay: 10,
  coachMessagesPerDay: 30,
  workoutGenerationsPerMonth: 3,
} as const;

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | null;

export const BILLING_UNAVAILABLE = {
  error: "billing_unavailable" as const,
  message: "Pro subscriptions are coming soon.",
};

/** True when BILLING_ENABLED=true and all required Stripe env vars are set. */
export function isBillingEnabled(): boolean {
  if (process.env.BILLING_ENABLED !== "true") return false;
  return !!(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_PRICE_MONTHLY &&
    process.env.STRIPE_PRICE_ANNUAL
  );
}

export function isProActive(
  planTier?: PlanTier | null,
  subscriptionStatus?: SubscriptionStatus
): boolean {
  if (planTier !== "pro") return false;
  return subscriptionStatus === "active" || subscriptionStatus === "trialing";
}

/** Returns Stripe client or null when billing is not configured. */
export function getStripe(): Stripe | null {
  if (!isBillingEnabled()) return null;
  const key = process.env.STRIPE_SECRET_KEY!;
  return new Stripe(key);
}

export function getAppUrl(): string {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}
