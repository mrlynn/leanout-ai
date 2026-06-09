"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import { useBillingStatus } from "@/hooks/useBillingStatus";

/** Upgrade button when billing is on; muted "coming soon" when off. */
export function ProCta({ size = "sm" }: { size?: "sm" | "default" }) {
  const { billingEnabled, loading } = useBillingStatus();

  if (loading) return null;

  if (!billingEnabled) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-xl">
        <Crown size={12} /> Pro — coming soon
      </span>
    );
  }

  return (
    <Link href="/pricing">
      <Button variant="outline" size={size} className="rounded-xl gap-1">
        <Crown size={12} /> Unlock with Pro
      </Button>
    </Link>
  );
}
