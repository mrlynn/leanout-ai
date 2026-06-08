"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Activity } from "lucide-react";

interface Result {
  whr: number;
  wthr: number;
  riskCategory: string;
  riskColor: string;
  description: string;
  action: string;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-base font-bold text-foreground mb-2">{children}</p>;
}

function getRisk(sex: "male" | "female", whr: number, wthr: number): Omit<Result, "whr" | "wthr"> {
  // Waist-to-height ratio is the primary metric
  if (wthr < 0.4) {
    return {
      riskCategory: "Underweight",
      riskColor: "text-blue-600 bg-blue-50 border-blue-200",
      description: "Your waist is very small relative to your height.",
      action: "Ensure you are eating enough to support healthy body composition.",
    };
  }
  if (wthr < 0.5) {
    return {
      riskCategory: "Healthy",
      riskColor: "text-green-600 bg-green-50 border-green-200",
      description: "Low visceral fat risk. You are in the healthy range for metabolic disease markers.",
      action: "Maintain your current habits — you're doing well.",
    };
  }
  if (wthr < 0.6) {
    const highRiskWHR = sex === "male" ? 0.9 : 0.85;
    if (whr >= highRiskWHR) {
      return {
        riskCategory: "Elevated Risk",
        riskColor: "text-amber-600 bg-amber-50 border-amber-200",
        description: "Both your waist-to-height and waist-to-hip ratios indicate elevated visceral fat.",
        action: "Focus on calorie deficit, aerobic exercise (3–5x/week), and reducing refined carbs.",
      };
    }
    return {
      riskCategory: "Slightly Elevated",
      riskColor: "text-amber-500 bg-amber-50 border-amber-100",
      description: "Moderate visceral fat risk. Small lifestyle changes can bring this into the healthy range.",
      action: "Add 150+ min/week of moderate cardio and reduce added sugars.",
    };
  }
  return {
    riskCategory: "High Risk",
    riskColor: "text-red-600 bg-red-50 border-red-200",
    description: "High visceral fat is strongly linked to type 2 diabetes, heart disease, and metabolic syndrome.",
    action: "Consult your doctor. A structured fat-loss plan and medical monitoring are recommended.",
  };
}

export default function VisceralFatPage() {
  const [sex, setSex] = useState<"male" | "female">("male");
  const [unit, setUnit] = useState<"imperial" | "metric">("imperial");
  const [height, setHeight] = useState("");
  const [waist, setWaist] = useState("");
  const [hip, setHip] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  function calculate() {
    const h = Number(height);
    const w = Number(waist);
    const hp = Number(hip);
    if (!h || !w || !hp) return;

    const whr = w / hp;
    const wthr = w / h;
    const risk = getRisk(sex, whr, wthr);
    setResult({ whr, wthr, ...risk });
  }

  const canCalculate = height !== "" && waist !== "" && hip !== "";

  const unitLabel = unit === "imperial" ? "inches" : "cm";

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Visceral Fat Risk Estimator</h1>
          <p className="text-sm text-muted-foreground">
            Waist-to-height ratio — more accurate than BMI for metabolic disease risk.
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 text-sm text-blue-800">
        <p className="font-semibold mb-1">Why not just use BMI?</p>
        <p>BMI doesn&apos;t distinguish fat from muscle or where fat is stored. Visceral fat (around your organs) is what drives health risk — and waist measurements capture this far better than weight alone.</p>
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
          <SectionLabel>Units</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            {(["imperial", "metric"] as const).map((u) => (
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
                {u === "imperial" ? "Imperial (in)" : "Metric (cm)"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <SectionLabel>Height ({unitLabel})</SectionLabel>
          <p className="text-xs text-muted-foreground mb-2">
            {unit === "imperial" ? "Convert feet to inches (e.g. 5′7″ = 67 in)" : "Enter in centimeters (e.g. 170)"}
          </p>
          <div className="relative">
            <Input
              type="number"
              min={unit === "imperial" ? 48 : 120}
              max={unit === "imperial" ? 96 : 240}
              placeholder={unit === "imperial" ? "e.g. 67" : "e.g. 170"}
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="pr-10"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {unit === "imperial" ? "in" : "cm"}
            </span>
          </div>
        </div>

        <div>
          <SectionLabel>Waist circumference ({unitLabel})</SectionLabel>
          <p className="text-xs text-muted-foreground mb-2">Measure at the narrowest point, above the navel</p>
          <div className="relative">
            <Input
              type="number"
              min={1}
              placeholder={unit === "imperial" ? "e.g. 34" : "e.g. 86"}
              value={waist}
              onChange={(e) => setWaist(e.target.value)}
              className="pr-10"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {unit === "imperial" ? "in" : "cm"}
            </span>
          </div>
        </div>

        <div>
          <SectionLabel>Hip circumference ({unitLabel})</SectionLabel>
          <p className="text-xs text-muted-foreground mb-2">Measure at the widest point</p>
          <div className="relative">
            <Input
              type="number"
              min={1}
              placeholder={unit === "imperial" ? "e.g. 40" : "e.g. 100"}
              value={hip}
              onChange={(e) => setHip(e.target.value)}
              className="pr-10"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {unit === "imperial" ? "in" : "cm"}
            </span>
          </div>
        </div>

        <Button className="w-full" size="lg" onClick={calculate} disabled={!canCalculate}>
          Estimate My Risk
        </Button>
      </div>

      {result && (
        <div className="mt-6 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-lg font-bold">Your Visceral Fat Risk</h2>

          <div className={`rounded-xl p-4 border ${result.riskColor}`}>
            <p className="font-black text-2xl">{result.riskCategory}</p>
            <p className="text-sm mt-1 opacity-90">{result.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/40 border border-border rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Waist-to-Height</p>
              <p className="text-3xl font-black">{result.wthr.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Healthy: &lt;0.50</p>
            </div>
            <div className="bg-muted/40 border border-border rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Waist-to-Hip</p>
              <p className="text-3xl font-black">{result.whr.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">
                Healthy: &lt;{sex === "male" ? "0.90" : "0.85"}
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
            <p className="font-semibold mb-1">Recommended action</p>
            <p className="text-xs opacity-90">{result.action}</p>
          </div>

          <div className="border-t border-border pt-4 space-y-2 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground text-sm">Reference thresholds</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-green-50 border border-green-100 rounded-lg p-2">
                <p className="font-semibold text-green-700">Healthy</p>
                <p className="text-green-600">WHtR &lt; 0.50</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-2">
                <p className="font-semibold text-amber-700">Elevated</p>
                <p className="text-amber-600">0.50 – 0.60</p>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-lg p-2">
                <p className="font-semibold text-red-700">High</p>
                <p className="text-red-600">WHtR &gt; 0.60</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
