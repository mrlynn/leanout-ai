"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Scale } from "lucide-react";

type Unit = "imperial" | "metric";

interface Category {
  label: string;
  range: string;
  min: number;
  max: number;
  color: string;
  bg: string;
}

const CATEGORIES: Category[] = [
  { label: "Underweight", range: "< 18.5", min: 0, max: 18.5, color: "text-blue-600", bg: "bg-blue-400" },
  { label: "Normal weight", range: "18.5 – 24.9", min: 18.5, max: 25, color: "text-green-600", bg: "bg-green-400" },
  { label: "Overweight", range: "25 – 29.9", min: 25, max: 30, color: "text-amber-600", bg: "bg-amber-400" },
  { label: "Obese", range: "≥ 30", min: 30, max: 100, color: "text-red-600", bg: "bg-red-400" },
];

function getCategory(bmi: number): Category {
  return CATEGORIES.find((c) => bmi >= c.min && bmi < c.max) ?? CATEGORIES[CATEGORIES.length - 1];
}

function gaugePercent(bmi: number): number {
  // Map 10–45 BMI to 0–100%
  return Math.min(100, Math.max(0, ((bmi - 10) / 35) * 100));
}

export default function BMIPage() {
  const [unit, setUnit] = useState<Unit>("imperial");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weight, setWeight] = useState("");
  const [bmi, setBmi] = useState<number | null>(null);

  function calculate() {
    const weightKg =
      unit === "imperial" ? Number(weight) * 0.453592 : Number(weight);
    const heightM =
      unit === "imperial"
        ? (Number(heightFt) * 12 + (Number(heightIn) || 0)) * 0.0254
        : Number(heightCm) / 100;
    if (!weightKg || !heightM) return;
    setBmi(Math.round((weightKg / (heightM * heightM)) * 10) / 10);
  }

  const canCalc =
    weight !== "" &&
    (unit === "imperial" ? heightFt !== "" : heightCm !== "");

  const category = bmi !== null ? getCategory(bmi) : null;

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center">
          <Scale className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">BMI Calculator</h1>
          <p className="text-sm text-muted-foreground">
            Body Mass Index — a quick screening tool based on height and weight.
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
        {/* Unit toggle */}
        <div className="grid grid-cols-2 gap-2">
          {(["imperial", "metric"] as Unit[]).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUnit(u)}
              className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                unit === u
                  ? "bg-primary text-white border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              {u === "imperial" ? "Imperial (ft / lbs)" : "Metric (cm / kg)"}
            </button>
          ))}
        </div>

        {/* Height */}
        <div>
          <p className="text-base font-bold mb-2">Height</p>
          {unit === "imperial" ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <Input type="number" min={0} max={8} placeholder="Feet" value={heightFt} onChange={(e) => setHeightFt(e.target.value)} className="pr-10" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">ft</span>
              </div>
              <div className="relative">
                <Input type="number" min={0} max={11} placeholder="Inches" value={heightIn} onChange={(e) => setHeightIn(e.target.value)} className="pr-10" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">in</span>
              </div>
            </div>
          ) : (
            <div className="relative">
              <Input type="number" min={50} max={300} placeholder="e.g. 178" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className="pr-12" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">cm</span>
            </div>
          )}
        </div>

        {/* Weight */}
        <div>
          <p className="text-base font-bold mb-2">Weight</p>
          <div className="relative">
            <Input type="number" min={1} placeholder={unit === "imperial" ? "e.g. 178" : "e.g. 80"} value={weight} onChange={(e) => setWeight(e.target.value)} className="pr-14" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {unit === "imperial" ? "lbs" : "kg"}
            </span>
          </div>
        </div>

        <Button className="w-full" size="lg" onClick={calculate} disabled={!canCalc}>
          Calculate BMI
        </Button>
      </div>

      {/* Results */}
      {bmi !== null && category && (
        <div className="mt-6 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Your BMI</p>
            <p className={`text-6xl font-black ${category.color}`}>{bmi}</p>
            <p className={`text-lg font-semibold mt-1 ${category.color}`}>{category.label}</p>
          </div>

          {/* Gauge bar */}
          <div>
            <div className="relative h-4 rounded-full overflow-hidden flex">
              <div className="bg-blue-400 flex-1" />
              <div className="bg-green-400 flex-1" />
              <div className="bg-amber-400 flex-1" />
              <div className="bg-red-400 flex-1" />
            </div>
            <div
              className="relative -mt-5 flex justify-center"
              style={{ marginLeft: `calc(${gaugePercent(bmi)}% - 8px)` }}
            >
              <div className="w-4 h-4 rounded-full bg-foreground border-2 border-white shadow" />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-3">
              <span>Under</span>
              <span>Normal</span>
              <span>Over</span>
              <span>Obese</span>
            </div>
          </div>

          {/* Category table */}
          <div className="space-y-1.5">
            {CATEGORIES.map((c) => (
              <div
                key={c.label}
                className={`flex justify-between items-center px-3 py-2 rounded-lg text-sm transition-all ${
                  c.label === category.label ? "bg-primary/10 font-semibold" : ""
                }`}
              >
                <span className={c.label === category.label ? category.color : "text-muted-foreground"}>{c.label}</span>
                <span className={c.label === category.label ? category.color : "text-muted-foreground"}>{c.range}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground bg-muted/50 rounded-xl p-3">
            BMI is a screening tool, not a diagnostic measure. It doesn&apos;t account for muscle mass, bone density, or fat distribution. Athletes and highly muscular individuals often have a high BMI without excess body fat.
          </p>
        </div>
      )}
    </div>
  );
}
