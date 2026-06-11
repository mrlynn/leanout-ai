"use client";

import { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { healthSyncBlockedMessage, isNativeApp } from "@/lib/nativeBridge";
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
              ? "Grant Health permissions in Settings → Health → LeanOut."
              : healthSyncBlockedMessage())
        );
        return;
      }
      onSynced?.({
        steps: result.metrics?.steps,
        weightLbs: result.metrics?.weightLbs,
      });
      setMessage(result.message);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Sync failed unexpectedly.");
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
      {message && (
        <p
          role="status"
          className={`text-sm mt-2 leading-snug ${
            message.startsWith("Synced") ? "text-primary font-medium" : "text-destructive"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
