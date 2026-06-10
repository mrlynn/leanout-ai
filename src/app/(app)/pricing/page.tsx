"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, Crown, Loader2, Zap } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";

const PRO_FEATURES = [
  "Unlimited AI coach messages",
  "Unlimited meal plan generations",
  "50 photo & voice logs per day",
  "10 workout plan generations / month",
  "Weekly AI review reports (email + in-app)",
  "Smart check-in email reminders",
  "Adaptive macro adjustments",
  "Accountability partner share link",
];

const FREE_FEATURES = [
  "Daily check-ins & progress charts",
  "Manual, barcode & AI food logging",
  "10 coach messages / day",
  "2 meal plans / month",
  "5 photo & voice logs / day",
  "Adaptive expenditure estimate on dashboard",
  "All calculators & guides",
  "Gamification & streaks",
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [planTier, setPlanTier] = useState<"free" | "pro">("free");
  const [billingEnabled, setBillingEnabled] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  useEffect(() => {
    fetch("/api/billing/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setPlanTier(d.planTier);
          setBillingEnabled(!!d.billingEnabled);
        }
      });
  }, []);

  async function checkout(interval: "monthly" | "annual") {
    setLoading(interval);
    setCheckoutError("");
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setCheckoutError(data.message ?? data.error ?? "Checkout unavailable right now.");
    } catch {
      setCheckoutError("Checkout unavailable right now.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-orange pt-10 pb-16 md:pt-12">
        <PageContainer className="text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 mb-4">
            <Crown size={14} className="text-white" />
            <span className="text-white text-sm font-semibold">LeanOut Pro</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            More AI. Deeper coaching.
          </h1>
          <p className="text-orange-100 mt-3 text-base max-w-md mx-auto">
            Core features stay free forever. Pro removes the caps and automates the coaching you&apos;d do yourself.
          </p>
        </PageContainer>
      </div>

      <PageContainer className="-mt-8 pb-16 space-y-6">
        {!billingEnabled && planTier !== "pro" && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl px-4 py-3 text-sm font-medium text-center">
            Pro checkout activates when Stripe is configured. Preview what&apos;s included below.
          </div>
        )}

        {planTier === "pro" && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-2xl px-4 py-3 text-sm font-medium text-center">
            You&apos;re on Pro. Manage billing in{" "}
            <Link href="/settings" className="underline font-bold">Settings</Link>.
          </div>
        )}

        {checkoutError && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl px-4 py-3 text-sm text-center">
            {checkoutError}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl card-shadow p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Free</p>
            <p className="text-3xl font-black mt-2">$0</p>
            <p className="text-sm text-muted-foreground mt-1">Forever</p>
            <ul className="mt-6 space-y-2">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check size={14} className="text-muted-foreground mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-3xl card-shadow-md p-6 ring-2 ring-primary relative">
            {billingEnabled && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                7-day free trial
              </div>
            )}
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Pro</p>
            <p className="text-3xl font-black mt-2">$9.99<span className="text-base font-medium text-muted-foreground">/mo</span></p>
            <p className="text-sm text-muted-foreground mt-1">or $79/yr (save 34%)</p>
            <ul className="mt-6 space-y-2">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Zap size={14} className="text-primary mt-0.5 shrink-0" fill="currentColor" />
                  {f}
                </li>
              ))}
            </ul>
            {planTier !== "pro" && billingEnabled && (
              <div className="mt-6 space-y-2">
                <Button
                  onClick={() => checkout("annual")}
                  disabled={!!loading}
                  className="w-full gradient-orange border-0 h-12 rounded-2xl font-bold hover:opacity-90"
                >
                  {loading === "annual" ? <Loader2 className="animate-spin" size={18} /> : "Start trial — $79/yr"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => checkout("monthly")}
                  disabled={!!loading}
                  className="w-full rounded-2xl font-semibold h-11"
                >
                  {loading === "monthly" ? <Loader2 className="animate-spin" size={18} /> : "Monthly — $9.99/mo"}
                </Button>
              </div>
            )}
            {planTier !== "pro" && !billingEnabled && (
              <p className="mt-6 text-center text-sm font-medium text-muted-foreground bg-muted/50 rounded-2xl py-3">
                Subscriptions launching soon
              </p>
            )}
          </div>
        </div>

        {billingEnabled && (
          <p className="text-center text-xs text-muted-foreground">
            Cancel anytime via Stripe Customer Portal. No hidden fees.
          </p>
        )}
      </PageContainer>
    </div>
  );
}
