"use client";

import { useEffect, useState } from "react";
async function hasSession(): Promise<boolean> {
  const res = await fetch(`${window.location.origin}/api/auth/session`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { user?: unknown };
  return !!data?.user;
}

/** Native shell only: wait for session cookie, then hard-navigate to dashboard (avoids RSC -999 in WKWebView). */
export default function NativeBridgePage() {
  const [message, setMessage] = useState("Finishing sign-in…");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      for (let attempt = 0; attempt < 20; attempt++) {
        const loggedIn = await hasSession();
        if (cancelled) return;
        if (loggedIn) {
          window.location.replace(`${window.location.origin}/dashboard`);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
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
