"use client";

import { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isNativeApp } from "@/lib/nativeBridge";
import { syncHealthToBackend } from "@/lib/healthSync";

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
      const result = await syncHealthToBackend();
      if (!result.ok) {
        setMessage(
          result.message ||
            (isNativeApp()
              ? "Grant Health permissions in Settings."
              : "Install the LeanOut mobile app to sync Apple Health or Health Connect.")
        );
        return;
      }
      onSynced?.({
        steps: result.metrics?.steps,
        weightLbs: result.metrics?.weightLbs,
      });
      setMessage(result.message);
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
