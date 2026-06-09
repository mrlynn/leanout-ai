"use client";

import { createContext, useCallback, useContext, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { X, Zap, Crown } from "lucide-react";
import { useBillingStatus } from "@/hooks/useBillingStatus";

export interface LimitReachedPayload {
  feature: string;
  used: number;
  limit: number;
  period: string;
}

interface UpgradeContextValue {
  showUpgrade: (payload?: LimitReachedPayload) => void;
  hideUpgrade: () => void;
}

const UpgradeContext = createContext<UpgradeContextValue | null>(null);

const FEATURE_NAMES: Record<string, string> = {
  meal_plan: "meal plan generations",
  photo_log: "photo food logs",
  voice_log: "voice food logs",
  coach_message: "AI coach messages",
  workout_generation: "workout plan generations",
};

function UpgradeModalContent({
  payload,
  onClose,
}: {
  payload: LimitReachedPayload | null;
  onClose: () => void;
}) {
  const { billingEnabled } = useBillingStatus();

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-3xl card-shadow-md w-full max-w-md p-6 animate-in slide-in-from-bottom duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl gradient-orange flex items-center justify-center">
            <Crown size={22} className="text-white" />
          </div>
          <div>
            <h2 className="font-black text-xl tracking-tight">
              {billingEnabled ? "Upgrade to Pro" : "Daily limit reached"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {billingEnabled ? "7-day free trial included" : "Pro subscriptions launching soon"}
            </p>
          </div>
        </div>

        {payload && (
          <p className="text-sm text-muted-foreground mb-4 bg-orange-50 rounded-2xl px-4 py-3">
            You&apos;ve used <strong>{payload.used}/{payload.limit}</strong>{" "}
            {FEATURE_NAMES[payload.feature] ?? payload.feature} this {payload.period === "daily" ? "day" : "month"}.
          </p>
        )}

        {billingEnabled && (
          <ul className="space-y-2 text-sm mb-6">
            {[
              "Unlimited AI coach & meal plans",
              "50 photo & voice logs per day",
              "Weekly AI review reports",
              "Smart email reminders",
              "Adaptive macro adjustments",
              "Accountability partner sharing",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Zap size={14} className="text-primary shrink-0" fill="currentColor" />
                {item}
              </li>
            ))}
          </ul>
        )}

        {!billingEnabled && (
          <p className="text-sm text-muted-foreground mb-6">
            Your free limits reset {payload?.period === "monthly" ? "on the 1st of each month" : "at midnight UTC"}.
            Higher limits and automation features are on the way.
          </p>
        )}

        <div className="flex flex-col gap-2">
          {billingEnabled ? (
            <Link href="/pricing" onClick={onClose}>
              <Button className="w-full gradient-orange border-0 h-12 rounded-2xl font-bold hover:opacity-90">
                View plans — from $9.99/mo
              </Button>
            </Link>
          ) : (
            <Button onClick={onClose} className="w-full gradient-orange border-0 h-12 rounded-2xl font-bold hover:opacity-90">
              Got it
            </Button>
          )}
          {billingEnabled && (
            <Button variant="outline" onClick={onClose} className="w-full rounded-2xl">
              Maybe later
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function UpgradeProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState<LimitReachedPayload | null>(null);

  const showUpgrade = useCallback((p?: LimitReachedPayload) => {
    setPayload(p ?? null);
    setOpen(true);
  }, []);

  const hideUpgrade = useCallback(() => {
    setOpen(false);
    setPayload(null);
  }, []);

  return (
    <UpgradeContext.Provider value={{ showUpgrade, hideUpgrade }}>
      {children}
      {open && <UpgradeModalContent payload={payload} onClose={hideUpgrade} />}
    </UpgradeContext.Provider>
  );
}

export function useUpgradeModal() {
  const ctx = useContext(UpgradeContext);
  if (!ctx) throw new Error("useUpgradeModal must be used within UpgradeProvider");
  return ctx;
}

/** Call after API 429 with limit_reached body */
export function handleLimitReached(
  data: unknown,
  showUpgrade: (p?: LimitReachedPayload) => void
): boolean {
  if (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    (data as { error: string }).error === "limit_reached"
  ) {
    const d = data as LimitReachedPayload & { error: string };
    showUpgrade({
      feature: d.feature,
      used: d.used,
      limit: d.limit,
      period: d.period,
    });
    return true;
  }
  return false;
}
