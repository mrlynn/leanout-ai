"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Activity } from "lucide-react";

type Sex = "male" | "female";
type Unit = "imperial" | "metric";

interface BFCategory {
  label: string;
  maleRange: [number, number];
  femaleRange: [number, number];
  color: string;
  bg: string;
}

const CATEGORIES: BFCategory[] = [
  { label: "Essential Fat", maleRange: [2, 6], femaleRange: [10, 14], color: "text-purple-600", bg: "bg-purple-400" },
  { label: "Athletic", maleRange: [6, 14], femaleRange: [14, 21], color: "text-blue-600", bg: "bg-blue-400" },
  { label: "Fitness", maleRange: [14, 18], femaleRange: [21, 25], color: "text-green-600", bg: "bg-green-400" },
  { label: "Average", maleRange: [18, 25], femaleRange: [25, 32], color: "text-amber-600", bg: "bg-amber-400" },
  { label: "Obese", maleRange: [25, 100], femaleRange: [32, 100], color: "text-red-600", bg: "bg-red-400" },
];

function getCategory(bf: number, sex: Sex): BFCategory {
  const found = CATEGORIES.find((c) => {
    const [min, max] = sex === "male" ? c.maleRange : c.femaleRange;
    return bf >= min && bf < max;
  });
  return found ?? CATEGORIES[CATEGORIES.length - 1];
}

// U.S. Navy formula
function calcBodyFat(
  sex: Sex,
  heightCm: number,
  waistCm: number,
  neckCm: number,
  hipCm?: number
): number {
  if (sex === "male") {
    return (
      495 /
        (1.0324 -
          0.19077 * Math.log10(waistCm - neckCm) +
          0.15456 * Math.log10(heightCm)) -
      450
    );
  }
  return (
    495 /
      (1.29579 -
        0.35004 * Math.log10((waistCm + (hipCm ?? 0)) - neckCm) +
        0.22100 * Math.log10(heightCm)) -
    450
  );
}

export default function BodyFatPage() {
  const [sex, setSex] = useState<Sex>("male");
  const [unit, setUnit] = useState<Unit>("imperial");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [neck, setNeck] = useState("");
  const [waist, setWaist] = useState("");
  const [hip, setHip] = useState("");
  const [result, setResult] = useState<{ bf: number; leanLbs: number; fatLbs: number; weightLbs: number } | null>(null);

  const suffix = unit === "imperial" ? "in" : "cm";

  function toIn(val: string) {
    const n = Number(val);
    return unit === "imperial" ? n * 2.54 : n;
  }

  function calculate() {
    const h =
      unit === "imperial"
        ? (Number(heightFt) * 12 + (Number(heightIn) || 0)) * 2.54
        : Number(heightCm);
    const w = toIn(waist);
    const n = toIn(neck);
    const hi = sex === "female" ? toIn(hip) : undefined;

    if (!h || !w || !n || (sex === "female" && !hi)) return;

    const bf = Math.max(3, Math.round(calcBodyFat(sex, h, w, n, hi) * 10) / 10);
    // Approximate weight from waist (rough; just for lean/fat split demo)
    setResult({ bf, leanLbs: 0, fatLbs: 0, weightLbs: 0 });
  }

  const canCalc =
    neck !== "" &&
    waist !== "" &&
    (sex === "female" ? hip !== "" : true) &&
    (unit === "imperial" ? heightFt !== "" : heightCm !== "");

  const category = result ? getCategory(result.bf, sex) : null;

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Body Fat % Estimator</h1>
          <p className="text-sm text-muted-foreground">
            U.S. Navy tape-measure method — no calipers needed.
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
        {/* Sex */}
        <div>
          <p className="text-base font-bold mb-2">Sex</p>
          <div className="grid grid-cols-2 gap-2">
            {(["male", "female"] as Sex[]).map((s) => (
              <button key={s} type="button" onClick={() => setSex(s)}
                className={`py-2.5 rounded-xl text-sm font-semibold border transition-all capitalize ${sex === s ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Unit */}
        <div>
          <p className="text-base font-bold mb-2">Units</p>
          <div className="grid grid-cols-2 gap-2">
            {(["imperial", "metric"] as Unit[]).map((u) => (
              <button key={u} type="button" onClick={() => setUnit(u)}
                className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${unit === u ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"}`}>
                {u === "imperial" ? "Imperial (in)" : "Metric (cm)"}
              </button>
            ))}
          </div>
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

        {/* Neck */}
        <div>
          <p className="text-base font-bold mb-1">Neck circumference</p>
          <p className="text-xs text-muted-foreground mb-2">Measure just below the larynx (Adam&apos;s apple), sloping slightly downward.</p>
          <div className="relative">
            <Input type="number" min={1} placeholder={unit === "imperial" ? "e.g. 15" : "e.g. 38"} value={neck} onChange={(e) => setNeck(e.target.value)} className="pr-12" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>
          </div>
        </div>

        {/* Waist */}
        <div>
          <p className="text-base font-bold mb-1">Waist circumference</p>
          <p className="text-xs text-muted-foreground mb-2">
            {sex === "male" ? "Measure at the navel." : "Measure at the narrowest point."}
          </p>
          <div className="relative">
            <Input type="number" min={1} placeholder={unit === "imperial" ? "e.g. 34" : "e.g. 86"} value={waist} onChange={(e) => setWaist(e.target.value)} className="pr-12" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>
          </div>
        </div>

        {/* Hip (female only) */}
        {sex === "female" && (
          <div>
            <p className="text-base font-bold mb-1">Hip circumference</p>
            <p className="text-xs text-muted-foreground mb-2">Measure at the widest point.</p>
            <div className="relative">
              <Input type="number" min={1} placeholder={unit === "imperial" ? "e.g. 40" : "e.g. 102"} value={hip} onChange={(e) => setHip(e.target.value)} className="pr-12" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>
            </div>
          </div>
        )}

        <Button className="w-full" size="lg" onClick={calculate} disabled={!canCalc}>
          Estimate Body Fat
        </Button>
      </div>

      {/* Results */}
      {result && category && (
        <div className="mt-6 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Estimated Body Fat</p>
            <p className={`text-6xl font-black ${category.color}`}>{result.bf}%</p>
            <p className={`text-lg font-semibold mt-1 ${category.color}`}>{category.label}</p>
          </div>

          {/* Category bar */}
          <div className="space-y-2">
            {CATEGORIES.map((c) => {
              const [min, max] = sex === "male" ? c.maleRange : c.femaleRange;
              const isActive = c.label === category.label;
              return (
                <div key={c.label} className={`flex justify-between items-center px-3 py-2 rounded-lg text-sm ${isActive ? "bg-primary/10 font-semibold" : ""}`}>
                  <span className={isActive ? category.color : "text-muted-foreground"}>{c.label}</span>
                  <span className={isActive ? category.color : "text-muted-foreground"}>
                    {min}–{max === 100 ? "+" : max}%
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground bg-muted/50 rounded-xl p-3">
            The U.S. Navy formula has a margin of error of ±3–4%. For the most accurate measurement, use DEXA or hydrostatic weighing.
          </p>
        </div>
      )}
    </div>
  );
}
