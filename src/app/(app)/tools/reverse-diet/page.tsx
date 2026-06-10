"use client";

import { PageContainer } from "@/components/PageContainer";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp } from "lucide-react";

interface Phase {
  week: number;
  calories: number;
  change: number;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-base font-bold text-foreground mb-2">{children}</p>;
}

export default function ReverseDietPage() {
  const [currentCals, setCurrentCals] = useState("");
  const [targetCals, setTargetCals] = useState("");
  const [weeklyIncrease, setWeeklyIncrease] = useState("75");
  const [phases, setPhases] = useState<Phase[] | null>(null);

  function calculate() {
    const start = Number(currentCals);
    const target = Number(targetCals);
    const increment = Number(weeklyIncrease);
    if (!start || !target || !increment || target <= start) return;

    const result: Phase[] = [];
    let current = start;
    let week = 1;
    while (current < target) {
      const next = Math.min(current + increment, target);
      result.push({ week, calories: Math.round(next), change: Math.round(next - current) });
      current = next;
      week++;
      if (week > 52) break;
    }
    setPhases(result);
  }

  const canCalculate =
    currentCals !== "" && targetCals !== "" && weeklyIncrease !== "" &&
    Number(targetCals) > Number(currentCals);

  return (
    <PageContainer size="form" className="py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Reverse Dieting Planner</h1>
          <p className="text-sm text-muted-foreground">
            Ramp calories back up to maintenance slowly — without gaining fat.
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 text-sm text-blue-800">
        <p className="font-semibold mb-1">What is reverse dieting?</p>
        <p>After a cut, your metabolism has adapted downward. Adding calories too fast causes fat gain. A reverse diet slowly rebuilds your metabolic rate by adding 50–100 cal/week over 8–16 weeks.</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <SectionLabel>Current daily calories</SectionLabel>
          <p className="text-xs text-muted-foreground mb-2">What you&apos;re eating now at the end of your cut</p>
          <div className="relative">
            <Input
              type="number"
              min={800}
              placeholder="e.g. 1400"
              value={currentCals}
              onChange={(e) => setCurrentCals(e.target.value)}
              className="pr-14"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">cal/day</span>
          </div>
        </div>

        <div>
          <SectionLabel>Target maintenance calories</SectionLabel>
          <p className="text-xs text-muted-foreground mb-2">Your adaptive TDEE or estimated maintenance</p>
          <div className="relative">
            <Input
              type="number"
              min={1000}
              placeholder="e.g. 2000"
              value={targetCals}
              onChange={(e) => setTargetCals(e.target.value)}
              className="pr-14"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">cal/day</span>
          </div>
          {targetCals !== "" && currentCals !== "" && Number(targetCals) <= Number(currentCals) && (
            <p className="text-xs text-red-500 mt-1">Target must be higher than current calories.</p>
          )}
        </div>

        <div>
          <SectionLabel>Weekly calorie increase</SectionLabel>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {["50", "75", "100"].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setWeeklyIncrease(v)}
                className={`py-2.5 px-3 rounded-xl text-sm font-semibold transition-all border ${
                  weeklyIncrease === v
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:border-primary/40"
                }`}
              >
                +{v} cal
              </button>
            ))}
          </div>
          <div className="relative">
            <Input
              type="number"
              min={25}
              max={200}
              step={25}
              placeholder="Custom"
              value={weeklyIncrease}
              onChange={(e) => setWeeklyIncrease(e.target.value)}
              className="pr-20"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">cal/week</span>
          </div>
        </div>

        <Button className="w-full" size="lg" onClick={calculate} disabled={!canCalculate}>
          Generate My Schedule
        </Button>
      </div>

      {phases && (
        <div className="mt-6 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
          <div>
            <h2 className="text-lg font-bold">Your Reverse Diet Schedule</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {phases.length} weeks to reach {Number(targetCals).toLocaleString()} cal/day
            </p>
          </div>

          <div className="space-y-2">
            {phases.map((p) => (
              <div
                key={p.week}
                className="flex items-center justify-between bg-muted/40 border border-border rounded-xl px-4 py-3"
              >
                <span className="text-sm font-semibold text-muted-foreground">Week {p.week}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-green-600 font-semibold">+{p.change} cal</span>
                  <span className="text-base font-black text-foreground">{p.calories.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">cal/day</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
            <p className="font-semibold mb-1">Tips for success</p>
            <ul className="list-disc list-inside space-y-1 text-xs opacity-90">
              <li>Weigh yourself daily and track the 7-day average</li>
              <li>Expect a small initial gain (1–2 lbs) from water and glycogen — normal</li>
              <li>If you gain more than 0.5 lb/week for 2+ weeks, stay at that calorie level longer</li>
              <li>Prioritize adding calories from carbs first, then fat</li>
            </ul>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
