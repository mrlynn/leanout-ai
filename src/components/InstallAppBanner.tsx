"use client";

import { useEffect, useState } from "react";
import { Smartphone, X } from "lucide-react";
import { isNativeApp } from "@/lib/nativeBridge";

const DISMISS_KEY = "leanout-install-banner-dismissed";

export function InstallAppBanner() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<{
    prompt: () => Promise<void>;
  } | null>(null);

  useEffect(() => {
    if (isNativeApp()) return;
    if (localStorage.getItem(DISMISS_KEY)) return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt({ prompt: () => (e as BeforeInstallPromptEvent).prompt() });
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    const t = setTimeout(() => setShow(true), 3000);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(t);
    };
  }, []);

  if (!show) return null;

  async function install() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
    }
    dismiss();
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  }

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl gradient-orange flex items-center justify-center shrink-0">
        <Smartphone size={16} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm">Add LeanOut to your home screen</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Install for faster logging in the gym and kitchen. Native iOS/Android apps available via Capacitor.
        </p>
        <button
          type="button"
          onClick={install}
          className="mt-2 text-xs font-bold text-primary hover:underline"
        >
          {deferredPrompt ? "Install app" : "Dismiss"}
        </button>
      </div>
      <button type="button" onClick={dismiss} className="text-muted-foreground p-1" aria-label="Dismiss">
        <X size={16} />
      </button>
    </div>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}
