"use client";

import { UpgradeProvider } from "@/components/UpgradeModal";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <UpgradeProvider>{children}</UpgradeProvider>;
}
