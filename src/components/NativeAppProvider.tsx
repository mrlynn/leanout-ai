"use client";

import { useEffect } from "react";
import { isNativeApp, registerPushNotifications } from "@/lib/nativeBridge";

export function NativeAppProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!isNativeApp()) return;

    registerPushNotifications(async (token) => {
      await fetch("/api/user/push-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, platform: "native" }),
      });
    });
  }, []);

  return <>{children}</>;
}
