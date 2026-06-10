"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity } from "lucide-react";

interface HealthSummary {
  ok: boolean | null;
  checkedAt: string | null;
  ageMinutes: number | null;
  message?: string;
}

export function SystemStatus() {
  const [summary, setSummary] = useState<HealthSummary | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/admin/health/summary");
        if (!res.ok || cancelled) return;
        setSummary(await res.json());
      } catch {
        // ignore — nav badge is non-critical
      }
    }

    load();
    const id = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!summary || summary.ok === null) {
    return (
      <Link
        href="/admin"
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all"
      >
        <Activity size={14} />
        <span>Health pending</span>
      </Link>
    );
  }

  const stale = summary.ageMinutes != null && summary.ageMinutes > 90;
  const healthy = summary.ok && !stale;

  return (
    <Link
      href="/admin"
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
        healthy
          ? "text-green-400 hover:bg-sidebar-accent"
          : "text-amber-400 hover:bg-sidebar-accent"
      }`}
      title={
        summary.checkedAt
          ? `Last check: ${new Date(summary.checkedAt).toLocaleString()}`
          : "View system health"
      }
    >
      <span
        className={`w-2 h-2 rounded-full shrink-0 ${
          healthy ? "bg-green-400" : "bg-amber-400 animate-pulse"
        }`}
      />
      <Activity size={14} />
      <span>{healthy ? "Systems healthy" : stale ? "Health check stale" : "System issue"}</span>
    </Link>
  );
}
