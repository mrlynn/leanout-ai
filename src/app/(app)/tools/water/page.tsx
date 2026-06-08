"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Droplets } from "lucide-react";

type WeightUnit = "lbs" | "kg";
type Activity = "sedentary" | "moderate" | "active";
type Climate = "temperate" | "hot";

const ACTIVITIES: { value: Activity; label: string; multiplier: number }[] = [
  { value: "sedentary", label: "Sedentary (desk job, light movement)", multiplier: 1.0 },
  { value: "moderate", label: "Moderately Active (3–5 workouts/week)", multiplier: 1.15 },
  { value: "active", label: "Very Active (daily intense exercise)", multiplier: 1.35 },
];

const CLIMATES: { value: Climate; label: string; bonus: number }[] = [
  { value: "temperate", label: "Temperate / Indoor", bonus: 0 },
  { value: "hot", label: "Hot / Humid climate", bonus: 16 },
];

function buildSchedule(ozPerDay: number): { time: string; oz: number }[] {
  const wakeHours = [7, 9, 11, 13, 15, 17, 19, 21];
  const perDrink = Math.round(ozPerDay / wakeHours.length);
  return wakeHours.map((h) => ({
    time: h < 12 ? `${h}:00 AM` : h === 12 ? "12:00 PM" : `${h - 12}:00 PM`,
    oz: perDrink,
  }));
}

export default function WaterPage() {
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("lbs");
  const [weight, setWeight] = useState("");
  const [activity, setActivity] = useState<Activity>("moderate");
  const [climate, setClimate] = useState<Climate>("temperate");
  const [result, setResult] = useState<{ oz: number; ml: number; cups: number } | null>(null);

  function calculate() {
    const weightLbs =
      weightUnit === "lbs" ? Number(weight) : Number(weight) * 2.20462;
    if (!weightLbs) return;

    const activityMult = ACTIVITIES.find((a) => a.value === activity)!.multiplier;
    const climateBonus = CLIMATES.find((c) => c.value === climate)!.bonus;

    // Base: 0.5 oz per lb of bodyweight
    const baseOz = weightLbs * 0.5;
    const totalOz = Math.round(baseOz * activityMult + climateBonus);
    const ml = Math.round(totalOz * 29.5735);
    const cups = Math.round((totalOz / 8) * 10) / 10;

    setResult({ oz: totalOz, ml, cups });
  }

  const canCalc = weight !== "";

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
          <Droplets className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Water Intake Calculator</h1>
          <p className="text-sm text-muted-foreground">
            Find your daily hydration target and a sip schedule to hit it.
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

        {/* Climate */}
        <div>
          <p className="text-base font-bold mb-2">Climate</p>
          <div className="space-y-2">
            {CLIMATES.map((c) => (
              <button key={c.value} type="button" onClick={() => setClimate(c.value)}
                className={`w-full text-left py-3 px-4 rounded-xl text-sm font-semibold border transition-all ${climate === c.value ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"}`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <Button className="w-full" size="lg" onClick={calculate} disabled={!canCalc}>
          Calculate Water Intake
        </Button>
      </div>

      {/* Results */}
      {result && (
        <div className="mt-6 space-y-4">
          {/* Main numbers */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <p className="text-sm text-muted-foreground text-center mb-3">Your daily target</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-3xl font-black text-blue-600">{result.oz}</p>
                <p className="text-xs text-blue-400 mt-0.5">fl oz</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-3xl font-black text-blue-600">{result.ml}</p>
                <p className="text-xs text-blue-400 mt-0.5">mL</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-3xl font-black text-blue-600">{result.cups}</p>
                <p className="text-xs text-blue-400 mt-0.5">cups</p>
              </div>
            </div>
          </div>

          {/* Sip schedule */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <p className="text-sm font-bold mb-3">💧 Sip schedule</p>
            <div className="grid grid-cols-2 gap-2">
              {buildSchedule(result.oz).map(({ time, oz }) => (
                <div key={time} className="flex justify-between items-center px-3 py-2 rounded-lg bg-blue-50 border border-blue-100 text-sm">
                  <span className="text-blue-700 font-medium">{time}</span>
                  <span className="text-blue-600 font-bold">{oz} oz</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Drink a glass at each time above. Adjust if you work out — drink extra before, during, and after exercise.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
