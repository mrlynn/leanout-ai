"use client";

import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";

type Direction = "kg-to-lbs" | "lbs-to-kg";

// Standard weight plates in kg and their lbs equivalents
const KG_PLATES = [
  { kg: 0.25, lbs: 0.55, color: "bg-white border-2 border-gray-300 text-gray-700" },
  { kg: 0.5, lbs: 1.1, color: "bg-white border-2 border-gray-300 text-gray-700" },
  { kg: 1.25, lbs: 2.75, color: "bg-yellow-300 text-yellow-900" },
  { kg: 2.5, lbs: 5.5, color: "bg-green-500 text-white" },
  { kg: 5, lbs: 11, color: "bg-white border-2 border-gray-300 text-gray-700" },
  { kg: 10, lbs: 22, color: "bg-green-500 text-white" },
  { kg: 15, lbs: 33, color: "bg-yellow-400 text-yellow-900" },
  { kg: 20, lbs: 44, color: "bg-blue-500 text-white" },
  { kg: 25, lbs: 55, color: "bg-red-500 text-white" },
  { kg: 50, lbs: 110, color: "bg-gray-800 text-white" },
];

// Standard weight plates in lbs
const LBS_PLATES = [
  { lbs: 2.5, kg: 1.13, color: "bg-yellow-300 text-yellow-900" },
  { lbs: 5, kg: 2.27, color: "bg-white border-2 border-gray-300 text-gray-700" },
  { lbs: 10, kg: 4.54, color: "bg-white border-2 border-gray-300 text-gray-700" },
  { lbs: 25, kg: 11.34, color: "bg-green-500 text-white" },
  { lbs: 35, kg: 15.88, color: "bg-yellow-400 text-yellow-900" },
  { lbs: 45, kg: 20.41, color: "bg-blue-500 text-white" },
  { lbs: 55, kg: 24.95, color: "bg-red-500 text-white" },
  { lbs: 100, kg: 45.36, color: "bg-gray-800 text-white" },
];

// Bar weights
const BARS = [
  { label: "Men's Olympic bar", kg: 20, lbs: 44 },
  { label: "Women's Olympic bar", kg: 15, lbs: 33 },
  { label: "EZ curl bar", kg: 10, lbs: 22 },
  { label: "Standard bar", kg: 7, lbs: 15 },
  { label: "Trap/hex bar", kg: 18, lbs: 40 },
  { label: "Safety squat bar", kg: 25, lbs: 55 },
];

interface PlateCombo {
  plate: number;
  count: number;
}

function findPlates(targetPerSide: number, unit: "kg" | "lbs"): PlateCombo[] {
  const available = unit === "kg"
    ? [...KG_PLATES].map((p) => p.kg).reverse()
    : [...LBS_PLATES].map((p) => p.lbs).reverse();

  const combos: PlateCombo[] = [];
  let remaining = targetPerSide;

  for (const plate of available) {
    if (remaining <= 0) break;
    const count = Math.floor(remaining / plate);
    if (count > 0) {
      combos.push({ plate, count });
      remaining = Math.round((remaining - plate * count) * 1000) / 1000;
    }
  }

  return combos;
}

function PlateVisual({ weight, color }: { weight: number; color: string }) {
  // Scale plate height based on weight
  const height = Math.min(96, Math.max(32, 32 + weight * 1.2));
  return (
    <div
      className={`flex items-center justify-center rounded-sm font-bold text-xs ${color} shadow`}
      style={{ width: 28, height, writingMode: "vertical-lr", textOrientation: "mixed" }}
    >
      {weight}
    </div>
  );
}

export default function PlateConverterPage() {
  const [direction, setDirection] = useState<Direction>("kg-to-lbs");
  const [input, setInput] = useState("");
  const [barKg, setBarKg] = useState(20);
  const [selectedBar, setSelectedBar] = useState(0);

  const fromUnit = direction === "kg-to-lbs" ? "kg" : "lbs";
  const toUnit = direction === "kg-to-lbs" ? "lbs" : "kg";
  const factor = direction === "kg-to-lbs" ? 2.20462 : 0.453592;

  const inputNum = Number(input);
  const converted = inputNum ? Math.round(inputNum * factor * 100) / 100 : null;

  // Barbell plate calculator
  const barWeight = direction === "kg-to-lbs" ? barKg : barKg * 2.20462;
  const totalTarget = inputNum || 0;
  const perSide = Math.max(0, (totalTarget - barWeight) / 2);
  const plateCombos = perSide > 0 ? findPlates(perSide, fromUnit) : [];

  const plateLibrary = direction === "kg-to-lbs" ? KG_PLATES : LBS_PLATES;

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center">
          <ArrowLeftRight className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Plate Converter</h1>
          <p className="text-sm text-muted-foreground">
            Convert between kg and lbs — plates, bars, and full barbell loads.
          </p>
        </div>
      </div>

      {/* Direction toggle */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
        <div className="grid grid-cols-2 gap-2">
          {(["kg-to-lbs", "lbs-to-kg"] as Direction[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => { setDirection(d); setInput(""); }}
              className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                direction === d ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              {d === "kg-to-lbs" ? "kg → lbs" : "lbs → kg"}
            </button>
          ))}
        </div>

        {/* Simple converter */}
        <div>
          <p className="text-base font-bold mb-2">Quick convert</p>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="number"
                min={0}
                placeholder={`Enter ${fromUnit}`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">{fromUnit}</span>
            </div>
            <ArrowLeftRight className="w-5 h-5 text-muted-foreground shrink-0" />
            <div className="relative flex-1">
              <div className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm pr-12 text-foreground font-semibold">
                {converted !== null ? converted : <span className="text-muted-foreground font-normal">—</span>}
              </div>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">{toUnit}</span>
            </div>
          </div>
        </div>

        {/* Plate reference table */}
        <div>
          <p className="text-base font-bold mb-3">Standard plate weights</p>
          <div className="rounded-xl overflow-hidden border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wide">Plate</th>
                  <th className="text-right px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wide">kg</th>
                  <th className="text-right px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wide">lbs</th>
                  <th className="w-6" />
                </tr>
              </thead>
              <tbody>
                {(direction === "kg-to-lbs" ? KG_PLATES : LBS_PLATES).map((p, i) => {
                  const kg = p.kg;
                  const lbs = p.lbs;
                  return (
                    <tr key={i} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${p.color}`}>
                          {direction === "kg-to-lbs" ? `${kg} kg` : `${lbs} lbs`}
                        </span>
                      </td>
                      <td className="text-right px-3 py-2 font-mono text-xs">{kg}</td>
                      <td className="text-right px-3 py-2 font-mono text-xs">{lbs}</td>
                      <td />
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Barbell load calculator */}
      <div className="mt-5 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
        <div>
          <p className="text-lg font-bold mb-1">Barbell Load Calculator</p>
          <p className="text-xs text-muted-foreground">Enter your total target weight — see which plates to load per side.</p>
        </div>

        {/* Bar selection */}
        <div>
          <p className="text-sm font-semibold mb-2">Bar</p>
          <div className="space-y-1.5">
            {BARS.map((bar, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { setSelectedBar(i); setBarKg(bar.kg); }}
                className={`w-full flex justify-between items-center py-2.5 px-3 rounded-xl text-sm border transition-all ${
                  selectedBar === i ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"
                }`}
              >
                <span className="font-medium">{bar.label}</span>
                <span className={`text-xs font-semibold ${selectedBar === i ? "text-white/80" : "text-muted-foreground"}`}>
                  {direction === "kg-to-lbs" ? `${bar.kg} kg` : `${bar.lbs} lbs`}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Target weight */}
        <div>
          <p className="text-sm font-semibold mb-2">Total target weight ({fromUnit})</p>
          <div className="relative">
            <input
              type="number"
              min={0}
              placeholder={`e.g. ${direction === "kg-to-lbs" ? "100" : "225"}`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring pr-14"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">{fromUnit}</span>
          </div>
        </div>

        {/* Results */}
        {inputNum > 0 && (
          <div>
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 mb-4 text-sm">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-bold text-primary">{inputNum} {fromUnit}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Bar</p>
                  <p className="font-bold">{direction === "kg-to-lbs" ? barKg : Math.round(barKg * 2.20462)} {fromUnit}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Per side</p>
                  <p className="font-bold">{Math.round(perSide * 100) / 100} {fromUnit}</p>
                </div>
              </div>
            </div>

            {plateCombos.length > 0 ? (
              <>
                {/* Plate visual */}
                <div className="flex items-center justify-center gap-1 mb-4 py-4 bg-muted/30 rounded-xl overflow-x-auto">
                  {/* Left plates (reversed) */}
                  {[...plateCombos].reverse().flatMap(({ plate, count }) =>
                    Array.from({ length: count }).map((_, i) => {
                      const plateData = plateLibrary.find((p) =>
                        (direction === "kg-to-lbs" ? (p as {kg:number}).kg : (p as {lbs:number}).lbs) === plate
                      );
                      return (
                        <PlateVisual key={`l-${plate}-${i}`} weight={plate} color={plateData?.color ?? "bg-gray-300"} />
                      );
                    })
                  )}
                  {/* Bar */}
                  <div className="h-4 w-16 bg-gray-500 rounded-full mx-1 shadow-inner" />
                  {/* Right plates */}
                  {plateCombos.flatMap(({ plate, count }) =>
                    Array.from({ length: count }).map((_, i) => {
                      const plateData = plateLibrary.find((p) =>
                        (direction === "kg-to-lbs" ? (p as {kg:number}).kg : (p as {lbs:number}).lbs) === plate
                      );
                      return (
                        <PlateVisual key={`r-${plate}-${i}`} weight={plate} color={plateData?.color ?? "bg-gray-300"} />
                      );
                    })
                  )}
                </div>

                {/* Plate list */}
                <p className="text-sm font-semibold mb-2">Load per side</p>
                <div className="space-y-2">
                  {plateCombos.map(({ plate, count }) => {
                    const plateData = plateLibrary.find((p) =>
                      (direction === "kg-to-lbs" ? (p as {kg:number}).kg : (p as {lbs:number}).lbs) === plate
                    );
                    return (
                      <div key={plate} className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-border">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${plateData?.color ?? "bg-gray-200"}`}>
                            {plate} {fromUnit}
                          </span>
                          <span className="text-sm text-muted-foreground">plate</span>
                        </div>
                        <span className="font-bold text-primary">× {count}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-3">
                {inputNum <= barWeight
                  ? `Target weight is at or below bar weight (${direction === "kg-to-lbs" ? barKg : Math.round(barKg * 2.20462)} ${fromUnit}). No plates needed.`
                  : "No standard plate combination found for this weight."}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
