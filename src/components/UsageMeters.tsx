"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Crown, Loader2 } from "lucide-react";

interface UsageItem {
  feature: string;
  label: string;
  used: number;
  limit: number;
  period: string;
  unlimited: boolean;
}

export function UsageMeters() {
  const [tier, setTier] = useState<"free" | "pro">("free");
  const [billingEnabled, setBillingEnabled] = useState(false);
  const [items, setItems] = useState<UsageItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/billing/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.usage) {
          setTier(d.planTier);
          setBillingEnabled(!!d.billingEnabled);
          setItems(d.usage.items);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="animate-spin text-muted-foreground" size={20} />
      </div>
    );
  }

  const nearLimit = items.filter((i) => !i.unlimited && i.limit > 0 && i.used / i.limit >= 0.8);

  return (
    <div className="bg-white rounded-3xl card-shadow p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">AI usage today</p>
        {tier === "pro" ? (
          <span className="flex items-center gap-1 text-xs font-bold text-primary">
            <Crown size={12} /> Pro
          </span>
        ) : billingEnabled ? (
          <Link href="/pricing" className="text-xs font-bold text-primary hover:underline">
            Upgrade
          </Link>
        ) : null}
      </div>

      <div className="space-y-2">
        {items
          .filter((i) => i.period === "daily" || i.feature === "meal_plan" || i.feature === "workout_generation")
          .map((item) => {
            const pct = item.unlimited ? 0 : item.limit > 0 ? Math.min(100, (item.used / item.limit) * 100) : 0;
            const atLimit = !item.unlimited && item.limit > 0 && item.used >= item.limit;
            return (
              <div key={item.feature}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">{item.label}</span>
                  <span className={atLimit ? "text-red-600 font-bold" : "text-muted-foreground"}>
                    {item.unlimited ? `${item.used} · ∞` : `${item.used}/${item.limit}`}
                  </span>
                </div>
                {!item.unlimited && item.limit > 0 && (
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${atLimit ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-primary"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {tier === "free" && nearLimit.length > 0 && (
        <p className="text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2 mt-3">
          Running low on AI credits.{" "}
          {billingEnabled ? (
            <>
              <Link href="/pricing" className="font-bold underline">Go Pro</Link> for higher limits.
            </>
          ) : (
            "Higher limits coming with Pro."
          )}
        </p>
      )}
    </div>
  );
}
