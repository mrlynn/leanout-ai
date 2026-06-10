"use client";

import { UpgradeProvider } from "@/components/UpgradeModal";
import { NativeAppProvider } from "@/components/NativeAppProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <UpgradeProvider>
      <NativeAppProvider>{children}</NativeAppProvider>
    </UpgradeProvider>
  );
}
