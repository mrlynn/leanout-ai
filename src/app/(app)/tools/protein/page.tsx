"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Beef } from "lucide-react";

type WeightUnit = "lbs" | "kg";
type Goal = "lose" | "maintain" | "build";
type Activity = "sedentary" | "moderate" | "active";

const GOALS: { value: Goal; label: string }[] = [
  { value: "lose", label: "Lose Fat" },
  { value: "maintain", label: "Maintain Weight" },
  { value: "build", label: "Build Muscle" },
];

const ACTIVITIES: { value: Activity; label: string }[] = [
  { value: "sedentary", label: "Sedentary (little or no exercise)" },
  { value: "moderate", label: "Moderate (3–5x / week)" },
  { value: "active", label: "Very Active (6–7x / week or hard labor)" },
];

// g per lb of bodyweight
const PROTEIN_RANGES: Record<Goal, Record<Activity, [number, number, number]>> = {
  lose:     { sedentary: [0.6, 0.8, 1.0], moderate: [0.8, 1.0, 1.2], active: [1.0, 1.2, 1.4] },
  maintain: { sedentary: [0.5, 0.7, 0.9], moderate: [0.7, 0.9, 1.1], active: [0.9, 1.1, 1.3] },
  build:    { sedentary: [0.7, 0.9, 1.1], moderate: [0.9, 1.1, 1.3], active: [1.1, 1.3, 1.5] },
};

const PROTEIN_FOODS = [
  { name: "Chicken breast (4oz)", g: 35, emoji: "🍗" },
  { name: "Greek yogurt (1 cup)", g: 20, emoji: "🥛" },
  { name: "Eggs (2 large)", g: 12, emoji: "🥚" },
  { name: "Whey shake (1 scoop)", g: 25, emoji: "💪" },
  { name: "Canned tuna (3oz)", g: 20, emoji: "🐟" },
  { name: "Cottage cheese (½ cup)", g: 13, emoji: "🧀" },
];

export default function ProteinPage() {
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("lbs");
  const [weight, setWeight] = useState("");
  const [goal, setGoal] = useState<Goal>("lose");
  const [activity, setActivity] = useState<Activity>("moderate");
  const [result, setResult] = useState<{ min: number; target: number; max: number } | null>(null);

  function calculate() {
    const weightLbs =
      weightUnit === "lbs" ? Number(weight) : Number(weight) * 2.20462;
    if (!weightLbs) return;
    const [minR, targetR, maxR] = PROTEIN_RANGES[goal][activity];
    setResult({
      min: Math.round(weightLbs * minR),
      target: Math.round(weightLbs * targetR),
      max: Math.round(weightLbs * maxR),
    });
  }

  const canCalc = weight !== "";

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center">
          <Beef className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Protein Calculator</h1>
          <p className="text-sm text-muted-foreground">
            Find your daily protein target based on your goal and activity.
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
        {/* Weight */}
        <div>
          <p className="text-base font-bold mb-2">Your Weight</p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {(["lbs", "kg"] as WeightUnit[]).map((u) => (
              <button key={u} type="button" onClick={() => setWeightUnit(u)}
                className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${weightUnit === u ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"}`}>
                {u === "lbs" ? "Pounds" : "Kilograms"}
              </button>
            ))}
          </div>
          <div className="relative">
            <Input type="number" min={1} placeholder={weightUnit === "lbs" ? "e.g. 178" : "e.g. 80"} value={weight} onChange={(e) => setWeight(e.target.value)} className="pr-14" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{weightUnit}</span>
          </div>
        </div>

        {/* Goal */}
        <div>
          <p className="text-base font-bold mb-2">Goal</p>
          <div className="space-y-2">
            {GOALS.map((g) => (
              <button key={g.value} type="button" onClick={() => setGoal(g.value)}
                className={`w-full text-left py-3 px-4 rounded-xl text-sm font-semibold border transition-all ${goal === g.value ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"}`}>
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Activity */}
        <div>
          <p className="text-base font-bold mb-2">Activity Level</p>
          <div className="space-y-2">
            {ACTIVITIES.map((a) => (
              <button key={a.value} type="button" onClick={() => setActivity(a.value)}
                className={`w-full text-left py-3 px-4 rounded-xl text-sm font-semibold border transition-all ${activity === a.value ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"}`}>
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <Button className="w-full" size="lg" onClick={calculate} disabled={!canCalc}>
          Calculate Protein
        </Button>
      </div>

      {/* Results */}
      {result && (
        <div className="mt-6 space-y-4">
          {/* Main result */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <p className="text-sm text-muted-foreground mb-1 text-center">Daily Protein Target</p>
            <p className="text-6xl font-black text-primary text-center">{result.target}<span className="text-2xl font-semibold text-muted-foreground">g</span></p>
            <div className="flex justify-between mt-4 text-center">
              <div>
                <p className="text-2xl font-bold text-muted-foreground">{result.min}g</p>
                <p className="text-xs text-muted-foreground mt-0.5">Minimum</p>
              </div>
              <div className="border-l border-r border-border px-6">
                <p className="text-2xl font-bold text-primary">{result.target}g</p>
                <p className="text-xs text-muted-foreground mt-0.5">Target</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-muted-foreground">{result.max}g</p>
                <p className="text-xs text-muted-foreground mt-0.5">Maximum</p>
              </div>
            </div>
          </div>

          {/* Meal split */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <p className="text-sm font-bold mb-3">Spread across 4 meals</p>
            <div className="grid grid-cols-4 gap-2">
              {["Breakfast", "Lunch", "Dinner", "Snack"].map((meal) => (
                <div key={meal} className="bg-primary/5 border border-primary/10 rounded-xl p-3 text-center">
                  <p className="text-xl font-black text-primary">{Math.round(result.target / 4)}g</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{meal}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Food sources */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <p className="text-sm font-bold mb-3">High-protein food sources</p>
            <div className="space-y-2">
              {PROTEIN_FOODS.map((f) => (
                <div key={f.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm">{f.emoji} {f.name}</span>
                  <span className="text-sm font-semibold text-primary">{f.g}g protein</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
