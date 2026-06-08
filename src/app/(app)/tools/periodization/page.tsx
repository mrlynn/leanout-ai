"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart2 } from "lucide-react";

interface Phase {
  name: string;
  durationWeeks: number;
  calories: number;
  proteinG: number;
  goal: string;
  color: string;
}

interface PlanResult {
  phases: Phase[];
  totalWeeks: number;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-base font-bold text-foreground mb-2">{children}</p>;
}

export default function PeriodizationPage() {
  const [currentBF, setCurrentBF] = useState("");
  const [targetBF, setTargetBF] = useState("");
  const [weight, setWeight] = useState("");
  const [sex, setSex] = useState<"male" | "female">("male");
  const [tdee, setTdee] = useState("");
  const [plan, setPlan] = useState<PlanResult | null>(null);

  function calculate() {
    const bf = Number(currentBF) / 100;
    const tbf = Number(targetBF) / 100;
    const w = Number(weight);
    const maintenance = Number(tdee);
    if (!bf || !tbf || !w || !maintenance) return;

    const fatMass = w * bf;
    const leanMass = w - fatMass;
    const phases: Phase[] = [];

    const minCutBF = sex === "male" ? 0.08 : 0.16;
    const optBulkBF = sex === "male" ? 0.15 : 0.22;

    if (bf > optBulkBF + 0.02) {
      // Need to cut first
      const targetFatMass = leanMass / (1 - tbf) - leanMass / (1 - tbf) * (1 - tbf);
      const fatToLose = Math.max(fatMass - leanMass * (tbf / (1 - tbf)), 2);
      const weeksToLose = Math.ceil((fatToLose * 3500) / (500 * 7));
      const cutCals = Math.round(maintenance - 500);

      phases.push({
        name: "Cut Phase",
        durationWeeks: Math.min(weeksToLose, 16),
        calories: cutCals,
        proteinG: Math.round(leanMass * 1.2),
        goal: `Reach ~${(tbf * 100).toFixed(0)}% body fat`,
        color: "bg-orange-50 border-orange-200 text-orange-800",
      });

      if (weeksToLose > 16) {
        phases.push({
          name: "Diet Break",
          durationWeeks: 2,
          calories: maintenance,
          proteinG: Math.round(leanMass * 1.0),
          goal: "Restore hormones and metabolism",
          color: "bg-blue-50 border-blue-200 text-blue-800",
        });
        phases.push({
          name: "Cut Phase 2",
          durationWeeks: weeksToLose - 16,
          calories: cutCals - 50,
          proteinG: Math.round(leanMass * 1.2),
          goal: `Complete fat loss to ${(tbf * 100).toFixed(0)}%`,
          color: "bg-orange-50 border-orange-200 text-orange-800",
        });
      }

      phases.push({
        name: "Reverse Diet",
        durationWeeks: 6,
        calories: maintenance,
        proteinG: Math.round(leanMass * 1.0),
        goal: "Restore TDEE before bulk",
        color: "bg-green-50 border-green-200 text-green-800",
      });

      void targetFatMass;
      void fatToLose;
    }

    if (bf <= optBulkBF || phases.length > 0) {
      const bulkCals = Math.round(maintenance + 250);
      phases.push({
        name: "Lean Bulk Phase",
        durationWeeks: 16,
        calories: bulkCals,
        proteinG: Math.round(leanMass * 0.9),
        goal: `Build muscle — stop at ${(optBulkBF * 100).toFixed(0)}% BF`,
        color: "bg-violet-50 border-violet-200 text-violet-800",
      });
      phases.push({
        name: "Cut Phase",
        durationWeeks: 10,
        calories: Math.round(maintenance - 500),
        proteinG: Math.round(leanMass * 1.2),
        goal: `Return to ${(minCutBF * 100).toFixed(0)}–${((minCutBF + 0.04) * 100).toFixed(0)}% BF`,
        color: "bg-orange-50 border-orange-200 text-orange-800",
      });
    }

    if (bf <= minCutBF + 0.04 && bf >= minCutBF) {
      phases.length = 0;
      const bulkCals = Math.round(maintenance + 250);
      phases.push({
        name: "Lean Bulk",
        durationWeeks: 20,
        calories: bulkCals,
        proteinG: Math.round(leanMass * 0.9),
        goal: `Maximize muscle gain — stop at ${(optBulkBF * 100).toFixed(0)}% BF`,
        color: "bg-violet-50 border-violet-200 text-violet-800",
      });
    }

    setPlan({
      phases,
      totalWeeks: phases.reduce((a, p) => a + p.durationWeeks, 0),
    });
  }

  const canCalculate = currentBF !== "" && targetBF !== "" && weight !== "" && tdee !== "";

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center">
          <BarChart2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Cut / Bulk / Maintain Planner</h1>
          <p className="text-sm text-muted-foreground">
            Know exactly when to cut, when to bulk, and what to eat in each phase.
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <SectionLabel>Sex</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            {(["male", "female"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSex(s)}
                className={`py-2.5 px-3 rounded-xl text-sm font-semibold transition-all border capitalize ${
                  sex === s
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:border-primary/40"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <SectionLabel>Current weight (lbs)</SectionLabel>
          <div className="relative">
            <Input
              type="number"
              min={80}
              placeholder="e.g. 185"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="pr-10"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">lbs</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <SectionLabel>Current body fat %</SectionLabel>
            <div className="relative">
              <Input
                type="number"
                min={4}
                max={60}
                placeholder={sex === "male" ? "e.g. 20" : "e.g. 27"}
                value={currentBF}
                onChange={(e) => setCurrentBF(e.target.value)}
                className="pr-7"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
            </div>
          </div>
          <div>
            <SectionLabel>Goal body fat %</SectionLabel>
            <div className="relative">
              <Input
                type="number"
                min={4}
                max={50}
                placeholder={sex === "male" ? "e.g. 12" : "e.g. 20"}
                value={targetBF}
                onChange={(e) => setTargetBF(e.target.value)}
                className="pr-7"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
            </div>
          </div>
        </div>

        <div>
          <SectionLabel>Maintenance calories (TDEE)</SectionLabel>
          <p className="text-xs text-muted-foreground mb-2">Use the Adaptive TDEE tool for best results</p>
          <div className="relative">
            <Input
              type="number"
              min={1000}
              placeholder="e.g. 2200"
              value={tdee}
              onChange={(e) => setTdee(e.target.value)}
              className="pr-14"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">cal/day</span>
          </div>
        </div>

        <Button className="w-full" size="lg" onClick={calculate} disabled={!canCalculate}>
          Build My Periodization Plan
        </Button>
      </div>

      {plan && (
        <div className="mt-6 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
          <div>
            <h2 className="text-lg font-bold">Your Periodization Plan</h2>
            <p className="text-sm text-muted-foreground">{plan.totalWeeks} weeks total · {plan.phases.length} phases</p>
          </div>

          <div className="space-y-3">
            {plan.phases.map((phase, i) => (
              <div key={i} className={`rounded-xl border p-4 ${phase.color}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm">{phase.name}</span>
                  <span className="text-xs font-semibold opacity-70">{phase.durationWeeks} weeks</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  <div>
                    <span className="opacity-70">Calories: </span>
                    <span className="font-semibold">{phase.calories.toLocaleString()} cal/day</span>
                  </div>
                  <div>
                    <span className="opacity-70">Protein: </span>
                    <span className="font-semibold">{phase.proteinG}g/day</span>
                  </div>
                </div>
                <p className="text-xs opacity-80 italic">{phase.goal}</p>
              </div>
            ))}
          </div>

          <div className="bg-muted/40 border border-border rounded-xl p-4 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground text-sm">Key rules for each phase</p>
            <p><strong>Cut:</strong> 0.5–1% body weight per week max. Preserve muscle with high protein + strength training.</p>
            <p><strong>Bulk:</strong> &lt;0.5 lb/week gain. Any faster and you&apos;re mostly gaining fat.</p>
            <p><strong>Reverse/Break:</strong> Resist adding calories too fast. Slow and boring is correct here.</p>
          </div>
        </div>
      )}
    </div>
  );
}
