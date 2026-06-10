"use client";

import { PageContainer } from "@/components/PageContainer";
import { useState } from "react";
import { Clock } from "lucide-react";

interface Protocol {
  id: string;
  name: string;
  eating: number;
  fasting: number;
  description: string;
  best: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
}

const PROTOCOLS: Protocol[] = [
  {
    id: "16-8",
    name: "16:8",
    eating: 8,
    fasting: 16,
    description: "Fast for 16 hours, eat during an 8-hour window. Most popular protocol.",
    best: "Daily fat loss, metabolic health, simplicity",
    difficulty: "Beginner",
  },
  {
    id: "18-6",
    name: "18:6",
    eating: 6,
    fasting: 18,
    description: "18-hour fast, 6-hour eating window. Accelerates fat burning.",
    best: "Faster fat loss, appetite control",
    difficulty: "Intermediate",
  },
  {
    id: "20-4",
    name: "20:4 (Warrior Diet)",
    eating: 4,
    fasting: 20,
    description: "Eat one large meal within a 4-hour window. Intense, effective.",
    best: "Maximum fat burning, metabolic flexibility",
    difficulty: "Advanced",
  },
  {
    id: "5-2",
    name: "5:2",
    eating: 7,
    fasting: 0,
    description: "Eat normally 5 days/week. On 2 non-consecutive days, limit to 500–600 cal.",
    best: "Flexibility, those who dislike daily windows",
    difficulty: "Intermediate",
  },
  {
    id: "omad",
    name: "OMAD",
    eating: 1,
    fasting: 23,
    description: "One Meal A Day. All calories in a single 1-hour window.",
    best: "Extreme simplicity, rapid fat loss",
    difficulty: "Advanced",
  },
];

const DIFFICULTY_COLOR: Record<string, string> = {
  Beginner: "text-green-600 bg-green-50 border-green-200",
  Intermediate: "text-amber-600 bg-amber-50 border-amber-200",
  Advanced: "text-red-600 bg-red-50 border-red-200",
};

function generateSchedule(startHour: number, eatingHours: number): { label: string; active: boolean }[] {
  const hours: { label: string; active: boolean }[] = [];
  for (let i = 0; i < 24; i++) {
    const h = (startHour + i) % 24;
    const label = h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`;
    hours.push({ label, active: i < eatingHours });
  }
  return hours;
}

export default function FastingPage() {
  const [selected, setSelected] = useState<string>("16-8");
  const [windowStart, setWindowStart] = useState(12); // noon

  const protocol = PROTOCOLS.find((p) => p.id === selected)!;
  const schedule = protocol.id !== "5-2" ? generateSchedule(windowStart, protocol.eating) : null;

  const windowEnd = (windowStart + protocol.eating) % 24;
  const fmt = (h: number) =>
    h === 0 ? "12:00 AM" : h < 12 ? `${h}:00 AM` : h === 12 ? "12:00 PM" : `${h - 12}:00 PM`;

  return (
    <PageContainer size="form" className="py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center">
          <Clock className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Intermittent Fasting Planner</h1>
          <p className="text-sm text-muted-foreground">
            Choose your protocol and get a daily eating window schedule.
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {PROTOCOLS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelected(p.id)}
            className={`w-full text-left rounded-2xl p-4 border transition-all ${
              selected === p.id
                ? "bg-primary/5 border-primary shadow-sm"
                : "bg-card border-border hover:border-primary/30"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-foreground">{p.name}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${DIFFICULTY_COLOR[p.difficulty]}`}>
                {p.difficulty}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{p.description}</p>
          </button>
        ))}
      </div>

      {protocol.id !== "5-2" && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm mb-6">
          <p className="text-base font-bold mb-3">When do you want to start eating?</p>
          <div className="grid grid-cols-4 gap-2">
            {[8, 10, 12, 14, 16, 18, 19, 20].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setWindowStart(h)}
                className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all border ${
                  windowStart === h
                    ? "bg-primary text-white border-primary"
                    : "bg-muted/40 text-muted-foreground border-border hover:border-primary/40"
                }`}
              >
                {fmt(h)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
        <h2 className="text-lg font-bold">{protocol.name} Schedule</h2>

        {protocol.id !== "5-2" && schedule ? (
          <>
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="font-semibold text-green-600">Eat: </span>
                <span>{fmt(windowStart)} – {fmt(windowEnd)}</span>
              </div>
              <div>
                <span className="font-semibold text-muted-foreground">Fast: </span>
                <span className="text-muted-foreground">{protocol.fasting}h</span>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-0.5">
              {schedule.map((slot, i) => (
                <div
                  key={i}
                  title={slot.label}
                  className={`h-6 rounded-sm text-[9px] flex items-center justify-center font-medium ${
                    slot.active
                      ? "bg-primary text-white"
                      : "bg-muted/60 text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-primary inline-block" /> Eating window</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-muted inline-block" /> Fasting</span>
            </div>

            <div className="bg-muted/40 border border-border rounded-xl p-4 text-sm space-y-2">
              <p className="font-semibold">Macro distribution tips</p>
              <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                <li>First meal: moderate protein + fat — activates satiety without spike</li>
                <li>Pre-workout meal (if applicable): carbs + protein for performance</li>
                <li>Last meal: protein-heavy to preserve muscle overnight</li>
                <li>Black coffee, water, and electrolytes are fine during fasting hours</li>
              </ul>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                <p className="text-xs text-green-600 font-semibold mb-1">Normal days (5)</p>
                <p className="text-sm font-bold text-green-700">Eat normally</p>
                <p className="text-xs text-green-600 mt-0.5">Hit your TDEE</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
                <p className="text-xs text-amber-600 font-semibold mb-1">Restricted days (2)</p>
                <p className="text-sm font-bold text-amber-700">500–600 cal</p>
                <p className="text-xs text-amber-600 mt-0.5">Mon + Thu recommended</p>
              </div>
            </div>
            <div className="bg-muted/40 border border-border rounded-xl p-4 text-sm">
              <p className="font-semibold mb-2">500-cal day food ideas</p>
              <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                <li>2 eggs + vegetables (~200 cal) + chicken breast (~300 cal)</li>
                <li>Greek yogurt + berries + a small salad with protein</li>
                <li>Soup + lean protein — spread across 2 small meals</li>
              </ul>
            </div>
          </div>
        )}

        <div className="border-t border-border pt-4 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground mb-1">Best for: {protocol.best}</p>
          <p>IF is a tool for managing calorie intake, not magic. Total daily calories still determine fat loss.</p>
        </div>
      </div>
    </PageContainer>
  );
}
