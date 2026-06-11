"use client";

import { UpgradeProvider } from "@/components/UpgradeModal";
import { NativeAppProvider } from "@/components/NativeAppProvider";
import { FloatingQuickMenu } from "@/components/FloatingQuickMenu";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <UpgradeProvider>
      <NativeAppProvider>
        {children}
        <FloatingQuickMenu />
      </NativeAppProvider>
    </UpgradeProvider>
  );
}
