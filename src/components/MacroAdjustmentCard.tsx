"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp } from "lucide-react";
import { ProCta } from "@/components/ProCta";

interface MacroState {
  current: { calories: number; proteinG: number; carbsG: number; fatG: number } | null;
  suggestion: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    suggestedAt?: string;
  } | null;
}

export function MacroAdjustmentCard({ isPro }: { isPro: boolean }) {
  const [state, setState] = useState<MacroState | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  function load() {
    if (!isPro) { setLoading(false); return; }
    fetch("/api/pro/macro-adjustment")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setState(d))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [isPro]);

  async function generate() {
    setWorking(true);
    await fetch("/api/pro/macro-adjustment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate" }),
    });
    load();
    setWorking(false);
  }

  async function apply() {
    setWorking(true);
    await fetch("/api/pro/macro-adjustment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "apply" }),
    });
    load();
    setWorking(false);
  }

  if (!isPro) {
    return (
      <div className="bg-white rounded-3xl card-shadow p-5">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={16} className="text-primary" />
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Adaptive Macros</p>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Pro analyzes your expenditure and adherence to suggest macro tweaks — apply with one tap.
        </p>
        <ProCta />
      </div>
    );
  }

  if (loading) return <div className="flex justify-center py-6"><Loader2 className="animate-spin" size={20} /></div>;

  const s = state?.suggestion;

  return (
    <div className="bg-white rounded-3xl card-shadow p-5">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={16} className="text-primary" />
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Adaptive Macros</p>
      </div>

      {!s ? (
        <div>
          <p className="text-sm text-muted-foreground mb-3">Generate a data-driven macro adjustment based on your recent progress.</p>
          <Button onClick={generate} disabled={working} size="sm" className="rounded-xl gradient-orange border-0">
            {working ? <Loader2 size={14} className="animate-spin" /> : "Generate suggestion"}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-3 rounded-xl bg-muted/40">
              <p className="text-xs text-muted-foreground">Current</p>
              <p className="font-bold">{state?.current?.calories} kcal</p>
              <p className="text-xs">{state?.current?.proteinG}P · {state?.current?.carbsG}C · {state?.current?.fatG}F</p>
            </div>
            <div className="p-3 rounded-xl bg-orange-50">
              <p className="text-xs text-primary">Suggested</p>
              <p className="font-bold">{s.calories} kcal</p>
              <p className="text-xs">{s.proteinG}P · {s.carbsG}C · {s.fatG}F</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={apply} disabled={working} size="sm" className="rounded-xl gradient-orange border-0 flex-1">
              {working ? <Loader2 size={14} className="animate-spin" /> : "Apply targets"}
            </Button>
            <Button onClick={generate} disabled={working} variant="outline" size="sm" className="rounded-xl">
              Refresh
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
