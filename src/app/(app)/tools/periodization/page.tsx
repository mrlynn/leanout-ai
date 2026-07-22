"use client";

import { PageContainer } from "@/components/PageContainer";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart2, Calendar, List } from "lucide-react";

interface Phase {
  name: string;
  durationWeeks: number;
  calories: number;
  proteinG: number;
  goal: string;
  color: string;
  calColor: string; // calendar bg color (Tailwind bg class)
  dotColor: string; // legend dot color
}

interface PlanResult {
  phases: Phase[];
  totalWeeks: number;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-base font-bold text-foreground mb-2">{children}</p>;
}

// ─── Calendar helpers ────────────────────────────────────────────────────────

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Returns the phase name (or null) for a given calendar date given the plan
// starting on `startDate`.
function phaseForDate(
  date: Date,
  startDate: Date,
  phases: Phase[]
): Phase | null {
  const msPerDay = 86400000;
  const diffDays = Math.floor(
    (date.getTime() - startDate.getTime()) / msPerDay
  );
  if (diffDays < 0) return null;
  let cursor = 0;
  for (const phase of phases) {
    const end = cursor + phase.durationWeeks * 7;
    if (diffDays < end) return phase;
    cursor = end;
  }
  return null;
}

interface PhaseCal {
  startDate: Date;
  phases: Phase[];
  totalWeeks: number;
}

function PeriodizationCalendar({ startDate, phases, totalWeeks }: PhaseCal) {
  const endDate = addDays(startDate, totalWeeks * 7 - 1);

  // Build list of months to display
  const months: { year: number; month: number }[] = [];
  let cur = startOfMonth(startDate);
  while (cur <= endDate) {
    months.push({ year: cur.getFullYear(), month: cur.getMonth() });
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }

  const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const MONTH_NAMES = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {phases.map((p, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <span
              className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: p.dotColor }}
            />
            <span className="text-muted-foreground">{p.name}</span>
          </div>
        ))}
      </div>

      {/* Month grids */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {months.map(({ year, month }) => {
          const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
          const numDays = daysInMonth(year, month);
          const cells: (Date | null)[] = [
            ...Array(firstDay).fill(null),
            ...Array.from({ length: numDays }, (_, i) => new Date(year, month, i + 1)),
          ];
          // pad to complete last week
          while (cells.length % 7 !== 0) cells.push(null);

          return (
            <div key={`${year}-${month}`} className="bg-muted/30 rounded-xl p-3 border border-border">
              <p className="text-xs font-semibold text-foreground mb-2">
                {MONTH_NAMES[month]} {year}
              </p>
              <div className="grid grid-cols-7 gap-px">
                {DAYS.map((d) => (
                  <div key={d} className="text-center text-[10px] text-muted-foreground pb-1">
                    {d}
                  </div>
                ))}
                {cells.map((date, ci) => {
                  if (!date) {
                    return <div key={ci} />;
                  }
                  const phase = phaseForDate(date, startDate, phases);
                  const isStart = phase && isSameDay(date, startDate);
                  const isToday = isSameDay(date, new Date());
                  return (
                    <div
                      key={ci}
                      title={phase?.name}
                      className={`
                        aspect-square flex items-center justify-center rounded text-[11px] font-medium
                        transition-opacity
                        ${phase ? "" : "text-muted-foreground/40"}
                        ${isStart ? "ring-1 ring-offset-0 ring-foreground" : ""}
                        ${isToday ? "ring-1 ring-blue-500" : ""}
                      `}
                      style={
                        phase
                          ? { backgroundColor: phase.dotColor + "33", color: phase.dotColor }
                          : {}
                      }
                    >
                      {date.getDate()}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Plan ends <strong>{endDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</strong> · {totalWeeks} weeks total
      </p>
    </div>
  );
}

// ─── Phase color map ─────────────────────────────────────────────────────────

const CUT_COLORS   = { color: "bg-orange-50 border-orange-200 text-orange-800", calColor: "orange",   dotColor: "#ea580c" };
const BREAK_COLORS = { color: "bg-blue-50 border-blue-200 text-blue-800",       calColor: "blue",     dotColor: "#2563eb" };
const REV_COLORS   = { color: "bg-green-50 border-green-200 text-green-800",    calColor: "green",    dotColor: "#16a34a" };
const BULK_COLORS  = { color: "bg-violet-50 border-violet-200 text-violet-800", calColor: "violet",   dotColor: "#7c3aed" };

export default function PeriodizationPage() {
  const [currentBF, setCurrentBF] = useState("");
  const [targetBF, setTargetBF]   = useState("");
  const [weight, setWeight]       = useState("");
  const [sex, setSex]             = useState<"male" | "female">("male");
  const [tdee, setTdee]           = useState("");
  const [plan, setPlan]           = useState<PlanResult | null>(null);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [view, setView] = useState<"list" | "calendar">("list");

  function calculate() {
    const bf = Number(currentBF) / 100;
    const tbf = Number(targetBF) / 100;
    const w = Number(weight);
    const maintenance = Number(tdee);
    if (!bf || !tbf || !w || !maintenance) return;

    const leanMass = w * (1 - bf);
    const fatMass  = w * bf;
    const phases: Phase[] = [];

    const minCutBF  = sex === "male" ? 0.08 : 0.16;
    const optBulkBF = sex === "male" ? 0.15 : 0.22;

    if (bf > optBulkBF + 0.02) {
      const fatToLose    = Math.max(fatMass - leanMass * (tbf / (1 - tbf)), 2);
      const weeksToLose  = Math.ceil((fatToLose * 3500) / (500 * 7));
      const cutCals      = Math.round(maintenance - 500);

      phases.push({
        name: "Cut Phase",
        durationWeeks: Math.min(weeksToLose, 16),
        calories: cutCals,
        proteinG: Math.round(leanMass * 1.2),
        goal: `Reach ~${(tbf * 100).toFixed(0)}% body fat`,
        ...CUT_COLORS,
      });

      if (weeksToLose > 16) {
        phases.push({
          name: "Diet Break",
          durationWeeks: 2,
          calories: maintenance,
          proteinG: Math.round(leanMass * 1.0),
          goal: "Restore hormones and metabolism",
          ...BREAK_COLORS,
        });
        phases.push({
          name: "Cut Phase 2",
          durationWeeks: weeksToLose - 16,
          calories: cutCals - 50,
          proteinG: Math.round(leanMass * 1.2),
          goal: `Complete fat loss to ${(tbf * 100).toFixed(0)}%`,
          ...CUT_COLORS,
        });
      }

      phases.push({
        name: "Reverse Diet",
        durationWeeks: 6,
        calories: maintenance,
        proteinG: Math.round(leanMass * 1.0),
        goal: "Restore TDEE before bulk",
        ...REV_COLORS,
      });
    }

    if (bf <= optBulkBF || phases.length > 0) {
      const bulkCals = Math.round(maintenance + 250);
      phases.push({
        name: "Lean Bulk Phase",
        durationWeeks: 16,
        calories: bulkCals,
        proteinG: Math.round(leanMass * 0.9),
        goal: `Build muscle — stop at ${(optBulkBF * 100).toFixed(0)}% BF`,
        ...BULK_COLORS,
      });
      phases.push({
        name: "Cut Phase",
        durationWeeks: 10,
        calories: Math.round(maintenance - 500),
        proteinG: Math.round(leanMass * 1.2),
        goal: `Return to ${(minCutBF * 100).toFixed(0)}–${((minCutBF + 0.04) * 100).toFixed(0)}% BF`,
        ...CUT_COLORS,
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
        ...BULK_COLORS,
      });
    }

    setPlan({
      phases,
      totalWeeks: phases.reduce((a, p) => a + p.durationWeeks, 0),
    });
    setView("list");
  }

  const parsedStart = useMemo(() => {
    const d = new Date(startDate + "T00:00:00");
    return isNaN(d.getTime()) ? new Date() : d;
  }, [startDate]);

  const canCalculate = currentBF !== "" && targetBF !== "" && weight !== "" && tdee !== "";

  return (
    <PageContainer size="form" className="py-8">
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

        <div>
          <SectionLabel>Program start date</SectionLabel>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <Button className="w-full" size="lg" onClick={calculate} disabled={!canCalculate}>
          Build My Periodization Plan
        </Button>
      </div>

      {plan && (
        <div className="mt-6 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
          {/* Header + view toggle */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Your Periodization Plan</h2>
              <p className="text-sm text-muted-foreground">
                {plan.totalWeeks} weeks total · {plan.phases.length} phases · starts{" "}
                {parsedStart.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
            <div className="flex rounded-xl border border-border overflow-hidden flex-shrink-0">
              <button
                type="button"
                onClick={() => setView("list")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                  view === "list"
                    ? "bg-primary text-white"
                    : "bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                List
              </button>
              <button
                type="button"
                onClick={() => setView("calendar")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                  view === "calendar"
                    ? "bg-primary text-white"
                    : "bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Calendar
              </button>
            </div>
          </div>

          {/* ── List view ── */}
          {view === "list" && (
            <div className="space-y-3">
              {plan.phases.map((phase, i) => {
                // Compute this phase's start date for display
                const weekOffset = plan.phases.slice(0, i).reduce((a, p) => a + p.durationWeeks, 0);
                const phaseStart = addDays(parsedStart, weekOffset * 7);
                const phaseEnd   = addDays(phaseStart, phase.durationWeeks * 7 - 1);
                const fmt = (d: Date) =>
                  d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

                return (
                  <div key={i} className={`rounded-xl border p-4 ${phase.color}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm">{phase.name}</span>
                      <span className="text-xs font-semibold opacity-70">{phase.durationWeeks} weeks</span>
                    </div>
                    <p className="text-[11px] opacity-60 mb-2">{fmt(phaseStart)} – {fmt(phaseEnd)}</p>
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
                );
              })}
            </div>
          )}

          {/* ── Calendar view ── */}
          {view === "calendar" && (
            <PeriodizationCalendar
              startDate={parsedStart}
              phases={plan.phases}
              totalWeeks={plan.totalWeeks}
            />
          )}

          <div className="bg-muted/40 border border-border rounded-xl p-4 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground text-sm">Key rules for each phase</p>
            <p><strong>Cut:</strong> 0.5–1% body weight per week max. Preserve muscle with high protein + strength training.</p>
            <p><strong>Bulk:</strong> &lt;0.5 lb/week gain. Any faster and you&apos;re mostly gaining fat.</p>
            <p><strong>Reverse/Break:</strong> Resist adding calories too fast. Slow and boring is correct here.</p>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
