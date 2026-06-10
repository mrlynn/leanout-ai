"use client";

import { PageContainer } from "@/components/PageContainer";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp, Plus, Trash2 } from "lucide-react";

interface WeekEntry {
  id: number;
  startWeight: string;
  endWeight: string;
  avgCalories: string;
}

interface Result {
  trueMaintenance: number;
  deficit: number;
  weeklyChange: number;
  adjustedTDEE: number;
}

let nextId = 1;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-base font-bold text-foreground mb-2">{children}</p>;
}

export default function AdaptiveTDEEPage() {
  const [weeks, setWeeks] = useState<WeekEntry[]>([
    { id: nextId++, startWeight: "", endWeight: "", avgCalories: "" },
    { id: nextId++, startWeight: "", endWeight: "", avgCalories: "" },
  ]);
  const [result, setResult] = useState<Result | null>(null);
  const [unit, setUnit] = useState<"lbs" | "kg">("lbs");

  function addWeek() {
    setWeeks((w) => [...w, { id: nextId++, startWeight: "", endWeight: "", avgCalories: "" }]);
  }

  function removeWeek(id: number) {
    setWeeks((w) => w.filter((x) => x.id !== id));
  }

  function updateWeek(id: number, field: keyof Omit<WeekEntry, "id">, value: string) {
    setWeeks((w) => w.map((x) => (x.id === id ? { ...x, [field]: value } : x)));
  }

  function calculate() {
    const valid = weeks.filter(
      (w) => w.startWeight !== "" && w.endWeight !== "" && w.avgCalories !== ""
    );
    if (valid.length < 2) return;

    const CAL_PER_LB = 3500;
    const CAL_PER_KG = 7700;
    const calPerUnit = unit === "lbs" ? CAL_PER_LB : CAL_PER_KG;

    const tdeeEstimates = valid.map((w) => {
      const delta = Number(w.endWeight) - Number(w.startWeight);
      const calsFromFat = delta * calPerUnit;
      const intake = Number(w.avgCalories) * 7;
      return intake - calsFromFat / 7;
    });

    const avgTDEE = tdeeEstimates.reduce((a, b) => a + b, 0) / tdeeEstimates.length;
    const avgIntake =
      valid.reduce((a, w) => a + Number(w.avgCalories), 0) / valid.length;
    const deficit = avgTDEE - avgIntake;

    const totalStart = Number(valid[0].startWeight);
    const totalEnd = Number(valid[valid.length - 1].endWeight);
    const weeklyChange = (totalEnd - totalStart) / valid.length;

    setResult({
      trueMaintenance: Math.round(avgTDEE),
      deficit: Math.round(deficit),
      weeklyChange,
      adjustedTDEE: Math.round(avgTDEE),
    });
  }

  const canCalculate = weeks.filter(
    (w) => w.startWeight !== "" && w.endWeight !== "" && w.avgCalories !== ""
  ).length >= 2;

  return (
    <PageContainer size="form" className="py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Adaptive TDEE Calculator</h1>
          <p className="text-sm text-muted-foreground">
            Uses your actual weight trend to back-calculate your true maintenance calories — more accurate than any formula.
          </p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-sm text-amber-800">
        <p className="font-semibold mb-1">Why this beats TDEE formulas</p>
        <p>Formula-based TDEE is off by 10–20% for most people. This tool uses your real weight changes and calorie intake to reverse-engineer what your body actually burns.</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <SectionLabel>Weight unit</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            {(["lbs", "kg"] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                className={`py-2.5 px-3 rounded-xl text-sm font-semibold transition-all border ${
                  unit === u
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:border-primary/40"
                }`}
              >
                {u === "lbs" ? "Pounds (lbs)" : "Kilograms (kg)"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <SectionLabel>Weekly data (enter at least 2 weeks)</SectionLabel>
          <p className="text-xs text-muted-foreground mb-3">
            Use Monday morning weight for consistency. Log average daily calories for each week.
          </p>
          <div className="space-y-3">
            {weeks.map((w, i) => (
              <div key={w.id} className="bg-muted/40 border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Week {i + 1}</span>
                  {weeks.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeWeek(w.id)}
                      className="text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Start weight ({unit})</label>
                    <Input
                      type="number"
                      min={0}
                      step={0.1}
                      placeholder="e.g. 185"
                      value={w.startWeight}
                      onChange={(e) => updateWeek(w.id, "startWeight", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">End weight ({unit})</label>
                    <Input
                      type="number"
                      min={0}
                      step={0.1}
                      placeholder="e.g. 184.4"
                      value={w.endWeight}
                      onChange={(e) => updateWeek(w.id, "endWeight", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Avg cal/day</label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="e.g. 1800"
                      value={w.avgCalories}
                      onChange={(e) => updateWeek(w.id, "avgCalories", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addWeek}
            className="mt-3 flex items-center gap-2 text-sm text-primary font-semibold hover:opacity-80 transition-opacity"
          >
            <Plus className="w-4 h-4" /> Add another week
          </button>
        </div>

        <Button className="w-full" size="lg" onClick={calculate} disabled={!canCalculate}>
          Calculate My True TDEE
        </Button>
      </div>

      {result && (
        <div className="mt-6 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-lg font-bold">Your Adaptive TDEE</h2>

          <div className="gradient-orange rounded-xl p-5 text-white text-center">
            <p className="text-sm font-semibold uppercase tracking-wide opacity-90 mb-1">True Maintenance</p>
            <p className="text-5xl font-black">{result.trueMaintenance.toLocaleString()}</p>
            <p className="text-sm opacity-80 mt-1">calories / day</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/40 border border-border rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Avg weekly change</p>
              <p className={`text-2xl font-black ${result.weeklyChange < 0 ? "text-green-600" : result.weeklyChange > 0 ? "text-red-500" : "text-foreground"}`}>
                {result.weeklyChange > 0 ? "+" : ""}{result.weeklyChange.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">{unit} / week</p>
            </div>
            <div className="bg-muted/40 border border-border rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Avg daily deficit</p>
              <p className={`text-2xl font-black ${result.deficit > 0 ? "text-green-600" : result.deficit < 0 ? "text-red-500" : "text-foreground"}`}>
                {result.deficit > 0 ? "-" : "+"}{Math.abs(result.deficit)}
              </p>
              <p className="text-xs text-muted-foreground">cal / day</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 space-y-1">
            <p className="font-semibold">What to do with this number</p>
            <ul className="list-disc list-inside space-y-1 opacity-90 text-xs">
              <li>To lose ~1 lb/week: eat <strong>{(result.trueMaintenance - 500).toLocaleString()} cal/day</strong></li>
              <li>To lose ~0.5 lb/week: eat <strong>{(result.trueMaintenance - 250).toLocaleString()} cal/day</strong></li>
              <li>To maintain: eat <strong>{result.trueMaintenance.toLocaleString()} cal/day</strong></li>
              <li>To gain ~0.5 lb/week: eat <strong>{(result.trueMaintenance + 250).toLocaleString()} cal/day</strong></li>
            </ul>
          </div>

          <p className="text-xs text-muted-foreground">
            Update this every 4 weeks as your weight and intake change. The more weeks you enter, the more accurate the result.
          </p>
        </div>
      )}
    </PageContainer>
  );
}
