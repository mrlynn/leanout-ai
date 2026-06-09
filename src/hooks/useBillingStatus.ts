"use client";

import { useEffect, useState } from "react";

export interface BillingStatusState {
  billingEnabled: boolean;
  planTier: "free" | "pro";
  loading: boolean;
}

export function useBillingStatus(): BillingStatusState {
  const [state, setState] = useState<BillingStatusState>({
    billingEnabled: false,
    planTier: "free",
    loading: true,
  });

  useEffect(() => {
    fetch("/api/billing/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setState({
            billingEnabled: !!d.billingEnabled,
            planTier: d.planTier ?? "free",
            loading: false,
          });
        } else {
          setState((s) => ({ ...s, loading: false }));
        }
      })
      .catch(() => setState((s) => ({ ...s, loading: false })));
  }, []);

  return state;
}
