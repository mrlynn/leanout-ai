"use client";

import { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { readHealthSamples, isNativeApp } from "@/lib/nativeBridge";

export function HealthSyncButton({
  onSynced,
}: {
  onSynced?: (data: { steps?: number; weightLbs?: number }) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function sync() {
    setLoading(true);
    setMessage("");
    try {
      let steps: number | undefined;
      let weightLbs: number | undefined;
      let source = "manual";

      if (isNativeApp()) {
        const sample = await readHealthSamples();
        if (sample) {
          steps = sample.steps;
          weightLbs = sample.weightLbs;
          source = sample.source;
        }
      }

      if (!steps && !weightLbs) {
        setMessage(
          isNativeApp()
            ? "No health data available. Grant Health permissions in Settings."
            : "Install the LeanOut mobile app to sync Apple Health or Health Connect."
        );
        return;
      }

      const res = await fetch("/api/user/health-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps, weightLbs, source }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Sync failed");
        return;
      }
      onSynced?.({ steps, weightLbs });
      setMessage("Synced from health app");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={sync}
        disabled={loading}
        className="rounded-xl gap-2"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Heart size={14} />}
        Sync steps & weight
      </Button>
      {message && <p className="text-xs text-muted-foreground mt-2">{message}</p>}
    </div>
  );
}
