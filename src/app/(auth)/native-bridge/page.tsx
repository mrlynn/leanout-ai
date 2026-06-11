"use client";

import { useEffect, useState } from "react";
async function hasSession(): Promise<boolean> {
  const res = await fetch(`${window.location.origin}/api/auth/session`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    console.log("[native-bridge] session fetch failed, status=", res.status);
    return false;
  }
  const data = (await res.json()) as { user?: unknown };
  console.log("[native-bridge] session response=", JSON.stringify(data));
  return !!data?.user;
}

/** Native shell only: wait for session cookie, then hard-navigate to dashboard (avoids RSC -999 in WKWebView). */
export default function NativeBridgePage() {
  const [message, setMessage] = useState("Finishing sign-in…");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Up to 15 s total: first 10 checks every 300 ms, then slower back-off
      const delays = [
        ...Array(10).fill(300),
        ...Array(10).fill(600),
        ...Array(5).fill(1000),
      ];
      for (const delay of delays) {
        const loggedIn = await hasSession();
        if (cancelled) return;
        if (loggedIn) {
          window.location.replace(`${window.location.origin}/dashboard`);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      setMessage(
        "Session was not saved. Confirm AUTH_URL and NEXTAUTH_URL are https://www.leanout.app on Vercel, then try again."
      );
      window.setTimeout(() => {
        window.location.replace(`${window.location.origin}/login`);
      }, 3500);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <p className="text-sm text-muted-foreground text-center max-w-xs">{message}</p>
    </div>
  );
}
