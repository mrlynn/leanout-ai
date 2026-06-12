"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isNativeApp } from "@/lib/nativeBridge";

const CONSENT_KEY = "leanout-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isNativeApp()) return;
    if (localStorage.getItem(CONSENT_KEY)) return;
    setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      className="fixed bottom-20 inset-x-0 z-50 p-4 md:bottom-4 md:left-auto md:right-4 md:max-w-md md:p-0"
    >
      <div className="bg-white rounded-2xl card-shadow-md border border-border p-4 md:p-5">
        <p className="text-sm font-bold">Cookies on LeanOut AI</p>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
          We use essential cookies to keep you signed in and secure your session. We do not use
          advertising or analytics cookies.{" "}
          <Link href="/cookies" className="text-primary font-semibold hover:underline">
            Cookie Policy
          </Link>
        </p>
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={accept}
            className="flex-1 h-10 rounded-xl text-sm font-bold text-white gradient-orange hover:opacity-90 transition-opacity"
          >
            Got it
          </button>
          <Link
            href="/cookies"
            className="flex-1 h-10 rounded-xl text-sm font-bold border border-border flex items-center justify-center hover:bg-muted/50 transition-colors"
          >
            Learn more
          </Link>
        </div>
      </div>
    </div>
  );
}
