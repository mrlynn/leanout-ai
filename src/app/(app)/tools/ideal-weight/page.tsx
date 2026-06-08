"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Target } from "lucide-react";

type Sex = "male" | "female";
type Unit = "imperial" | "metric";

interface Formula {
  name: string;
  calc: (heightIn: number, sex: Sex) => number;
  note: string;
}

const FORMULAS: Formula[] = [
  {
    name: "Devine",
    note: "Widely used in clinical settings",
    calc: (h, s) =>
      s === "male" ? 50 + 2.3 * (h - 60) : 45.5 + 2.3 * (h - 60),
  },
  {
    name: "Robinson",
    note: "Revised Devine for broader populations",
    calc: (h, s) =>
      s === "male" ? 52 + 1.9 * (h - 60) : 49 + 1.7 * (h - 60),
  },
  {
    name: "Miller",
    note: "Accounts for lighter body frames",
    calc: (h, s) =>
      s === "male" ? 56.2 + 1.41 * (h - 60) : 53.1 + 1.36 * (h - 60),
  },
  {
    name: "Hamwi",
    note: "Commonly used by dietitians",
    calc: (h, s) =>
      s === "male" ? 48 + 2.7 * (h - 60) : 45.4 + 2.2 * (h - 60),
  },
];

function kgToLbs(kg: number) {
  return Math.round(kg * 2.20462);
}

export default function IdealWeightPage() {
  const [sex, setSex] = useState<Sex>("male");
  const [unit, setUnit] = useState<Unit>("imperial");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [results, setResults] = useState<{ name: string; note: string; lbs: number }[] | null>(null);

  function calculate() {
    const totalIn =
      unit === "imperial"
        ? Number(heightFt) * 12 + (Number(heightIn) || 0)
        : Number(heightCm) / 2.54;

    if (!totalIn || totalIn < 48) return;

    setResults(
      FORMULAS.map((f) => ({
        name: f.name,
        note: f.note,
        lbs: kgToLbs(f.calc(totalIn, sex)),
      }))
    );
  }

  const canCalc = unit === "imperial" ? heightFt !== "" : heightCm !== "";

  const avgLbs =
    results ? Math.round(results.reduce((s, r) => s + r.lbs, 0) / results.length) : 0;
  const minLbs = results ? Math.min(...results.map((r) => r.lbs)) : 0;
  const maxLbs = results ? Math.max(...results.map((r) => r.lbs)) : 0;

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center">
          <Target className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Ideal Weight Calculator</h1>
          <p className="text-sm text-muted-foreground">
            Four clinically used formulas, one recommended range.
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
          <p className="text-base font-bold mb-2">Height unit</p>
          <div className="grid grid-cols-2 gap-2">
            {(["imperial", "metric"] as Unit[]).map((u) => (
              <button key={u} type="button" onClick={() => setUnit(u)}
                className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${unit === u ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"}`}>
                {u === "imperial" ? "Feet & inches" : "Centimeters"}
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
              <Input type="number" min={100} max={250} placeholder="e.g. 178" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className="pr-12" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">cm</span>
            </div>
          )}
        </div>

        <Button className="w-full" size="lg" onClick={calculate} disabled={!canCalc}>
          Calculate
        </Button>
      </div>

      {/* Results */}
      {results && (
        <div className="mt-6 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
          {/* Range highlight */}
          <div className="gradient-orange rounded-xl p-5 text-white text-center">
            <p className="text-sm font-semibold opacity-80 mb-1">Recommended Range</p>
            <p className="text-4xl font-black">{minLbs} – {maxLbs} <span className="text-xl font-semibold opacity-80">lbs</span></p>
            <p className="text-sm opacity-70 mt-1">Average across all formulas: {avgLbs} lbs</p>
          </div>

          {/* Formula breakdown */}
          <div className="space-y-2">
            {results.map((r) => (
              <div key={r.name} className="flex items-center justify-between px-3 py-3 rounded-xl bg-muted/40 border border-border">
                <div>
                  <p className="text-sm font-semibold">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.note}</p>
                </div>
                <p className="text-lg font-bold text-primary">{r.lbs} lbs</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground bg-muted/50 rounded-xl p-3">
            These formulas were designed for adults of average build. Athletes, people with high muscle mass, or those outside average height ranges may find the results less applicable. Use as a general starting point, not a strict target.
          </p>
        </div>
      )}
    </div>
  );
}
