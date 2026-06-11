"use client";

import { useEffect, useState } from "react";

async function fetchSessionDebug(): Promise<{ ok: boolean; body: string; cookies: string }> {
  try {
    const res = await fetch(`${window.location.origin}/api/auth/session`, {
      credentials: "include",
      cache: "no-store",
    });
    const body = await res.text();
    const cookies = document.cookie || "(none)";
    return { ok: res.ok, body, cookies };
  } catch (e) {
    return { ok: false, body: String(e), cookies: document.cookie || "(none)" };
  }
}

/** Native shell only: wait for session cookie, then hard-navigate to dashboard (avoids RSC -999 in WKWebView). */
export default function NativeBridgePage() {
  const [lines, setLines] = useState<string[]>(["Checking session…"]);
  const [done, setDone] = useState(false);

  const addLine = (line: string) => setLines((prev) => [...prev, line]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Read debug info left by login page
      const loginResult = sessionStorage.getItem("__login_debug") ?? "(not set)";
      addLine(`Login result: ${loginResult}`);

      const delays = [
        ...Array(10).fill(300),
        ...Array(10).fill(600),
        ...Array(5).fill(1000),
      ];

      for (let i = 0; i < delays.length; i++) {
        const { ok, body, cookies } = await fetchSessionDebug();
        if (cancelled) return;

        if (i === 0 || i === 4 || !ok) {
          addLine(`[${i + 1}] status=${ok} cookies=${cookies} body=${body.slice(0, 120)}`);
        }

        let hasUser = false;
        try { hasUser = !!JSON.parse(body)?.user; } catch { /* ignore */ }

        if (hasUser) {
          window.location.replace(`${window.location.origin}/dashboard`);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, delays[i]));
      }

      setDone(true);
    })();

    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-6 bg-background overflow-auto">
      <p className="text-sm font-bold mb-3 text-foreground">
        {done ? "Session not found — debug info:" : "Finishing sign-in…"}
      </p>
      <div className="w-full max-w-sm bg-muted rounded-xl p-4 text-xs font-mono break-all space-y-1">
        {lines.map((l, i) => <p key={i} className="text-foreground/80">{l}</p>)}
      </div>
      {done && (
        <button
          className="mt-6 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold"
          onClick={() => window.location.replace(`${window.location.origin}/login`)}
        >
          Back to login
        </button>
      )}
    </div>
  );
}
