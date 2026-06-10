"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Crown, Loader2, ExternalLink } from "lucide-react";

interface BillingStatus {
  billingEnabled: boolean;
  planTier: "free" | "pro";
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  hasBillingAccount: boolean;
}

export function BillingSettings() {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    fetch("/api/billing/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setStatus(d))
      .finally(() => setLoading(false));
  }, []);

  async function openPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setPortalLoading(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-6"><Loader2 className="animate-spin text-muted-foreground" size={20} /></div>;
  }

  const isPro = status?.planTier === "pro";
  const billingEnabled = status?.billingEnabled ?? false;
  const renewDate = status?.currentPeriodEnd
    ? new Date(status.currentPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/40">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPro ? "gradient-orange" : "bg-muted"}`}>
            <Crown size={18} className={isPro ? "text-white" : "text-muted-foreground"} />
          </div>
          <div>
            <p className="font-bold">{isPro ? "LeanOut Pro" : "Free plan"}</p>
            <p className="text-xs text-muted-foreground">
              {isPro && status?.subscriptionStatus === "trialing" && "Trial active"}
              {isPro && status?.subscriptionStatus === "active" && renewDate && `Renews ${renewDate}`}
              {!isPro && billingEnabled && "Upgrade for unlimited AI coaching"}
              {!isPro && !billingEnabled && "Configure Stripe to enable Pro checkout"}
            </p>
          </div>
        </div>
      </div>

      {isPro && status?.hasBillingAccount && billingEnabled ? (
        <Button
          variant="outline"
          onClick={openPortal}
          disabled={portalLoading}
          className="w-full rounded-2xl gap-2"
        >
          {portalLoading ? <Loader2 size={16} className="animate-spin" /> : <ExternalLink size={16} />}
          Manage subscription
        </Button>
      ) : !isPro && billingEnabled ? (
        <Link href="/pricing">
          <Button className="w-full gradient-orange border-0 rounded-2xl font-bold h-11 hover:opacity-90">
            Upgrade to Pro — 7-day free trial
          </Button>
        </Link>
      ) : null}
    </div>
  );
}
