"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, TrendingUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdaptiveSignal } from "@/lib/adaptiveTargets";
import { ProCta } from "@/components/ProCta";

export type AdaptiveTargetsMacros = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export function AdaptiveTargetsCard({
  signals,
  macros,
  isPro,
}: {
  signals: AdaptiveSignal;
  macros: AdaptiveTargetsMacros | null;
  isPro: boolean;
}) {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  async function applyAdjustment() {
    if (!isPro || !signals.recommendation?.deltaCalories || !macros) return;
    setApplying(true);
    try {
      const newCalories = macros.calories + signals.recommendation.deltaCalories;
      await fetch("/api/pro/macro-adjustment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "apply_direct",
          calories: newCalories,
          proteinG: macros.proteinG,
          carbsG: macros.carbsG,
          fatG: macros.fatG,
          rationale: signals.recommendation.rationale,
        }),
      });
      setApplied(true);
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="bg-white rounded-3xl card-shadow-md p-6">
      <div className="flex items-center gap-2 mb-3">
        <Activity size={18} className="text-primary" />
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Adaptive targets
        </p>
      </div>

      <h2 className="text-lg font-black tracking-tight mb-1">{signals.headline}</h2>
      <p className="text-sm text-muted-foreground mb-4">{signals.focus}</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {signals.estimatedExpenditure !== null && (
          <Stat label="Est. expenditure" value={`${signals.estimatedExpenditure}`} unit="kcal" />
        )}
        {signals.weeklyWeightChangeLbs !== null && (
          <Stat
            label="Weight trend"
            value={`${signals.weeklyWeightChangeLbs <= 0 ? "" : "+"}${signals.weeklyWeightChangeLbs.toFixed(1)}`}
            unit="lbs/wk"
          />
        )}
        {signals.avgIntake !== null && (
          <Stat label="Avg intake" value={`${signals.avgIntake}`} unit="kcal" />
        )}
        <Stat label="Food logged" value={`${signals.loggingRate}`} unit="% / 7d" />
      </div>

      {signals.recommendation && signals.recommendation.type !== "none" && (
        <div className="rounded-2xl bg-orange-50 p-4 mb-4">
          <div className="flex items-start gap-2">
            <TrendingUp size={16} className="text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-primary">
                {signals.recommendation.type === "reduce_calories" && "Suggested: −100 kcal"}
                {signals.recommendation.type === "increase_calories" && "Suggested: +200 kcal"}
                {signals.recommendation.type === "adherence" && "Focus on adherence"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{signals.recommendation.rationale}</p>
            </div>
          </div>
          {isPro &&
            signals.recommendation.deltaCalories &&
            !applied && (
              <Button
                onClick={applyAdjustment}
                disabled={applying}
                size="sm"
                className="mt-3 rounded-xl gradient-orange border-0"
              >
                {applying ? <Loader2 size={14} className="animate-spin" /> : "Apply with one tap"}
              </Button>
            )}
          {applied && (
            <p className="text-xs font-bold text-green-700 mt-3">Targets updated. Regenerate meal plan if needed.</p>
          )}
          {!isPro && signals.recommendation.deltaCalories && (
            <div className="mt-3">
              <ProCta />
            </div>
          )}
        </div>
      )}

      <Link href="/progress" className="text-xs font-bold text-primary hover:underline">
        Full progress & macro history →
      </Link>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="stat-number text-xl mt-1">
        {value}
        <span className="text-xs font-medium text-muted-foreground ml-0.5">{unit}</span>
      </p>
    </div>
  );
}
