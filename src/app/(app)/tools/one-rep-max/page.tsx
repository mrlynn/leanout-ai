"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dumbbell } from "lucide-react";

type WeightUnit = "lbs" | "kg";

const EXERCISES = ["Bench Press", "Squat", "Deadlift", "Overhead Press", "Barbell Row"];

const PERCENTAGES = [
  { pct: 100, reps: 1, label: "1RM" },
  { pct: 95, reps: 2, label: "95%" },
  { pct: 90, reps: 4, label: "90%" },
  { pct: 85, reps: 5, label: "85%" },
  { pct: 80, reps: 8, label: "80%" },
  { pct: 75, reps: 10, label: "75%" },
  { pct: 70, reps: 12, label: "70%" },
  { pct: 65, reps: 15, label: "65%" },
  { pct: 60, reps: 20, label: "60%" },
];

function epley(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

export default function OneRepMaxPage() {
  const [exercise, setExercise] = useState(EXERCISES[0]);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("lbs");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [orm, setOrm] = useState<number | null>(null);

  function calculate() {
    const w = Number(weight);
    const r = Number(reps);
    if (!w || !r || r < 1) return;
    setOrm(epley(w, r));
  }

  const canCalc = weight !== "" && reps !== "" && Number(reps) >= 1;

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center">
          <Dumbbell className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">One-Rep Max Calculator</h1>
          <p className="text-sm text-muted-foreground">
            Estimate your 1RM and find your training zone weights.
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
        {/* Exercise */}
        <div>
          <p className="text-base font-bold mb-2">Exercise</p>
          <div className="space-y-2">
            {EXERCISES.map((ex) => (
              <button key={ex} type="button" onClick={() => setExercise(ex)}
                className={`w-full text-left py-3 px-4 rounded-xl text-sm font-semibold border transition-all ${exercise === ex ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"}`}>
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* Weight unit */}
        <div>
          <p className="text-base font-bold mb-2">Weight lifted</p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {(["lbs", "kg"] as WeightUnit[]).map((u) => (
              <button key={u} type="button" onClick={() => setWeightUnit(u)}
                className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${weightUnit === u ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"}`}>
                {u === "lbs" ? "Pounds" : "Kilograms"}
              </button>
            ))}
          </div>
          <div className="relative">
            <Input type="number" min={1} placeholder="e.g. 225" value={weight} onChange={(e) => setWeight(e.target.value)} className="pr-14" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{weightUnit}</span>
          </div>
        </div>

        {/* Reps */}
        <div>
          <p className="text-base font-bold mb-2">Reps performed</p>
          <div className="relative">
            <Input type="number" min={1} max={30} placeholder="e.g. 5" value={reps} onChange={(e) => setReps(e.target.value)} className="pr-14" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">reps</span>
          </div>
        </div>

        <Button className="w-full" size="lg" onClick={calculate} disabled={!canCalc}>
          Calculate 1RM
        </Button>
      </div>

      {/* Results */}
      {orm !== null && (
        <div className="mt-6 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
          <div className="gradient-orange rounded-xl p-5 text-white text-center">
            <p className="text-sm font-semibold opacity-80 mb-1">{exercise} — Estimated 1RM</p>
            <p className="text-6xl font-black">{orm}</p>
            <p className="text-sm opacity-80 mt-1">{weightUnit}</p>
          </div>

          {/* Training zones */}
          <div>
            <p className="text-sm font-bold mb-3">Training zones</p>
            <div className="space-y-2">
              {PERCENTAGES.map(({ pct, reps: r, label }) => {
                const zoneWeight = Math.round((orm * pct) / 100);
                const isMain = pct === 100;
                return (
                  <div key={pct} className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm ${isMain ? "bg-primary/10 font-semibold" : "border border-border"}`}>
                    <span className={isMain ? "text-primary font-bold" : "text-muted-foreground"}>{label}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground">{r} {r === 1 ? "rep" : "reps"}</span>
                      <span className={`font-bold ${isMain ? "text-primary" : ""}`}>{zoneWeight} {weightUnit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-muted-foreground bg-muted/50 rounded-xl p-3">
            Uses the Epley formula. Accuracy decreases with high reps (10+). Always warm up before attempting heavy lifts.
          </p>
        </div>
      )}
    </div>
  );
}
