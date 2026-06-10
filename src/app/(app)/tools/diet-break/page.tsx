"use client";

import { PageContainer } from "@/components/PageContainer";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Coffee } from "lucide-react";

interface BreakResult {
  breakDue: boolean;
  weeksUntilBreak: number;
  recommendedBreakDays: number;
  maintenanceTarget: number;
  returnCals: number;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-base font-bold text-foreground mb-2">{children}</p>;
}

const DEFICIT_LEVELS = [
  { value: "mild", label: "Mild (−250 cal/day)", deficit: 250 },
  { value: "moderate", label: "Moderate (−500 cal/day)", deficit: 500 },
  { value: "aggressive", label: "Aggressive (−750+ cal/day)", deficit: 750 },
];

export default function DietBreakPage() {
  const [weeksInDeficit, setWeeksInDeficit] = useState("");
  const [currentCals, setCurrentCals] = useState("");
  const [maintenanceCals, setMaintenanceCals] = useState("");
  const [deficitLevel, setDeficitLevel] = useState("moderate");
  const [result, setResult] = useState<BreakResult | null>(null);

  function calculate() {
    const weeks = Number(weeksInDeficit);
    const current = Number(currentCals);
    const maintenance = Number(maintenanceCals);
    if (!weeks || !current || !maintenance) return;

    const breakThreshold = deficitLevel === "mild" ? 16 : deficitLevel === "moderate" ? 10 : 6;
    const breakDue = weeks >= breakThreshold;
    const weeksUntilBreak = Math.max(0, breakThreshold - weeks);
    const breakDays = deficitLevel === "aggressive" ? 14 : 10;
    const returnCals = current - 100;

    setResult({
      breakDue,
      weeksUntilBreak,
      recommendedBreakDays: breakDays,
      maintenanceTarget: maintenance,
      returnCals,
    });
  }

  const canCalculate = weeksInDeficit !== "" && currentCals !== "" && maintenanceCals !== "";

  return (
    <PageContainer size="form" className="py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center">
          <Coffee className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Diet Break Planner</h1>
          <p className="text-sm text-muted-foreground">
            Know when to pause your cut to restore hormones and maintain long-term fat loss.
          </p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-sm text-amber-800">
        <p className="font-semibold mb-1">Why diet breaks work</p>
        <p>Extended calorie deficits lower leptin, slow metabolism, and increase cortisol. A 1–2 week break at maintenance restores hormones, reduces fatigue, and makes the next cut phase more effective — without undoing your progress.</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <SectionLabel>How long have you been cutting?</SectionLabel>
          <div className="relative">
            <Input
              type="number"
              min={1}
              placeholder="e.g. 8"
              value={weeksInDeficit}
              onChange={(e) => setWeeksInDeficit(e.target.value)}
              className="pr-16"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">weeks</span>
          </div>
        </div>

        <div>
          <SectionLabel>Deficit level</SectionLabel>
          <div className="space-y-2">
            {DEFICIT_LEVELS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setDeficitLevel(d.value)}
                className={`w-full text-left py-3 px-4 rounded-xl text-sm font-semibold transition-all border ${
                  deficitLevel === d.value
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:border-primary/40"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <SectionLabel>Current daily calories</SectionLabel>
          <div className="relative">
            <Input
              type="number"
              min={800}
              placeholder="e.g. 1500"
              value={currentCals}
              onChange={(e) => setCurrentCals(e.target.value)}
              className="pr-14"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">cal/day</span>
          </div>
        </div>

        <div>
          <SectionLabel>Estimated maintenance calories</SectionLabel>
          <p className="text-xs text-muted-foreground mb-2">Use the Adaptive TDEE Calculator for accuracy</p>
          <div className="relative">
            <Input
              type="number"
              min={1000}
              placeholder="e.g. 2000"
              value={maintenanceCals}
              onChange={(e) => setMaintenanceCals(e.target.value)}
              className="pr-14"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">cal/day</span>
          </div>
        </div>

        <Button className="w-full" size="lg" onClick={calculate} disabled={!canCalculate}>
          Should I Take a Break?
        </Button>
      </div>

      {result && (
        <div className="mt-6 space-y-4">
          <div className={`rounded-2xl p-6 border ${result.breakDue ? "bg-orange-50 border-orange-200" : "bg-green-50 border-green-200"}`}>
            <h2 className={`text-lg font-bold mb-1 ${result.breakDue ? "text-orange-800" : "text-green-800"}`}>
              {result.breakDue ? "⏸ Time for a diet break" : "✅ Keep going"}
            </h2>
            <p className={`text-sm ${result.breakDue ? "text-orange-700" : "text-green-700"}`}>
              {result.breakDue
                ? `You've been cutting long enough that a break will benefit you. Take ${result.recommendedBreakDays} days at maintenance before resuming.`
                : `You're ${result.weeksUntilBreak} week${result.weeksUntilBreak !== 1 ? "s" : ""} away from needing a break. Keep at it!`}
            </p>
          </div>

          {result.breakDue && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold">Your Break Plan</h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/40 border border-border rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Break duration</p>
                  <p className="text-3xl font-black text-foreground">{result.recommendedBreakDays}</p>
                  <p className="text-xs text-muted-foreground">days</p>
                </div>
                <div className="bg-muted/40 border border-border rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Eat at</p>
                  <p className="text-3xl font-black text-primary">{result.maintenanceTarget.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">cal/day</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
                <p className="font-semibold mb-2">After the break: resume at {result.returnCals.toLocaleString()} cal/day</p>
                <ul className="list-disc list-inside space-y-1 text-xs opacity-90">
                  <li>Expect 1–3 lbs of water weight to come back — that&apos;s normal</li>
                  <li>Your hunger and energy should reset within a few days</li>
                  <li>Maintain your training intensity during the break</li>
                  <li>A true break is at maintenance — not a cheat week</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
