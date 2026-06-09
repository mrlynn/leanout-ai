"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronDown, ChevronUp, Dumbbell, RotateCcw, Play } from "lucide-react";
import { WorkoutSessionLogger } from "@/components/WorkoutSessionLogger";

// ── Types ──────────────────────────────────────────────────────────

interface Exercise {
  name: string;
  category: string;
  sets: number;
  reps: string;
  rest: string;
  notes: string;
  isWarmup: boolean;
}

interface WorkoutDay {
  dayIndex: number;
  dayName: string;
  isRest: boolean;
  focus: string;
  workoutName: string;
  estimatedMinutes: number;
  exercises: Exercise[];
}

interface WorkoutPlanData {
  goal: string;
  preferences: {
    equipment: string;
    workoutsPerWeek: number;
    durationMinutes: number;
    experienceLevel: string;
    split: string;
    warmupSets: boolean;
    circuits: boolean;
  };
  schedule: WorkoutDay[];
  startDay: number; // 0=Mon … 6=Sun
}

const DAY_ABBREVS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ── Constants ──────────────────────────────────────────────────────

const FOCUS_COLORS: Record<string, string> = {
  Push:        "bg-blue-100 text-blue-700",
  Pull:        "bg-green-100 text-green-700",
  Legs:        "bg-orange-100 text-orange-700",
  Upper:       "bg-indigo-100 text-indigo-700",
  Lower:       "bg-teal-100 text-teal-700",
  "Full Body": "bg-violet-100 text-violet-700",
  Cardio:      "bg-red-100 text-red-700",
  Rest:        "bg-muted text-muted-foreground",
};

function focusBadge(focus: string) {
  return FOCUS_COLORS[focus] ?? "bg-muted text-muted-foreground";
}

const GOAL_LABELS: Record<string, string> = {
  build_muscle:      "Build Muscle",
  get_lean:          "Get Lean",
  get_stronger:      "Get Stronger",
  reduce_bodyweight: "Reduce Bodyweight",
  improve_fitness:   "Improve Fitness",
  powerlifting:      "Practice Powerlifting",
};

const EXPERIENCE_LABELS: Record<string, string> = {
  beginner:     "Beginner",
  intermediate: "Intermediate",
  advanced:     "Advanced",
};

// ── Day Card ───────────────────────────────────────────────────────

function DayCard({ day, isToday }: { day: WorkoutDay; isToday: boolean }) {
  const [open, setOpen] = useState(isToday && !day.isRest);

  return (
    <div
      className={`bg-card border rounded-2xl overflow-hidden transition-all ${
        isToday ? "border-primary ring-1 ring-primary" : "border-border"
      }`}
    >
      {/* Header row */}
      <button
        type="button"
        onClick={() => !day.isRest && setOpen((o) => !o)}
        className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-colors ${
          day.isRest ? "cursor-default" : "hover:bg-muted/40"
        }`}
      >
        {/* Day abbrev */}
        <div className="w-12 shrink-0 text-center">
          <p className={`text-xs font-black uppercase tracking-widest ${isToday ? "text-primary" : "text-muted-foreground"}`}>
            {day.dayName.slice(0, 3)}
          </p>
          {isToday && <p className="text-[10px] text-primary font-semibold mt-0.5">Today</p>}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold truncate ${day.isRest ? "text-muted-foreground" : ""}`}>
            {day.isRest ? "Rest Day" : day.workoutName}
          </p>
          {!day.isRest && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {day.estimatedMinutes} min · {day.exercises.filter((e) => !e.isWarmup).length} exercises
              {day.exercises.some((e) => e.isWarmup) ? ` + warm-up` : ""}
            </p>
          )}
        </div>

        {/* Focus badge + chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-xl ${focusBadge(day.focus)}`}>
            {day.focus}
          </span>
          {!day.isRest && (
            open
              ? <ChevronUp size={16} className="text-muted-foreground" />
              : <ChevronDown size={16} className="text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded exercises */}
      {open && !day.isRest && (
        <div className="px-5 pb-4 border-t border-border space-y-1 pt-3">
          {/* Warm-up section */}
          {day.exercises.some((e) => e.isWarmup) && (
            <>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Warm-Up</p>
              {day.exercises.filter((e) => e.isWarmup).map((ex, i) => (
                <ExerciseRow key={`wu-${i}`} exercise={ex} />
              ))}
              <div className="border-t border-dashed border-border my-2" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Main Work</p>
            </>
          )}

          {day.exercises.filter((e) => !e.isWarmup).map((ex, i) => (
            <ExerciseRow key={i} exercise={ex} />
          ))}
        </div>
      )}
    </div>
  );
}

function ExerciseRow({ exercise }: { exercise: Exercise }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{exercise.name}</p>
        {exercise.notes && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{exercise.notes}</p>
        )}
      </div>
      <div className="text-right shrink-0 space-y-0.5">
        <p className="text-sm font-bold">{exercise.sets} × {exercise.reps}</p>
        <p className="text-xs text-muted-foreground">Rest {exercise.rest}</p>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────

export default function WorkoutPage() {
  const [plan, setPlan]         = useState<WorkoutPlanData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [savingStart, setSavingStart] = useState(false);
  const [sessionDay, setSessionDay] = useState<WorkoutDay | null>(null);

  // 0 = Monday in our scheme; JS getDay() → 0=Sun,1=Mon…
  const todayIndex = (new Date().getDay() + 6) % 7;

  useEffect(() => {
    fetch("/api/workout/plan")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.plan) setPlan(data.plan); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setStartDay = useCallback(async (day: number) => {
    if (!plan || day === plan.startDay) return;
    setSavingStart(true);
    setPlan((p) => p ? { ...p, startDay: day } : p); // optimistic
    try {
      await fetch("/api/workout/plan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDay: day }),
      });
    } finally {
      setSavingStart(false);
    }
  }, [plan]);

  /** Rotate the schedule so slot 0 falls on `startDay`. */
  function rotatedSchedule(schedule: WorkoutDay[], startDay: number): WorkoutDay[] {
    const len = schedule.length; // always 7
    return Array.from({ length: len }, (_, i) => schedule[(startDay + i) % len]);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-orange px-6 pt-10 pb-12 md:pt-12">
        <div className="max-w-2xl mx-auto">
          <p className="text-orange-200 text-sm font-medium">AI-Generated</p>
          <h1 className="text-3xl font-black text-white tracking-tight">Workout Plan</h1>
          {plan && (
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
                {GOAL_LABELS[plan.goal] ?? plan.goal}
              </span>
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
                {plan.preferences.workoutsPerWeek}x / week
              </span>
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
                {EXPERIENCE_LABELS[plan.preferences.experienceLevel] ?? plan.preferences.experienceLevel}
              </span>
              <Link href="/workout/setup" className="ml-auto text-orange-200 text-xs font-semibold hover:text-white transition-colors">
                Change Plan →
              </Link>
            </div>
          )}
        </div>
      </div>

      {!plan ? (
        /* Empty state */
        <div className="max-w-lg mx-auto px-6 -mt-6 pb-10">
          <div className="bg-card rounded-3xl shadow-sm border border-border p-10 text-center space-y-5">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
              <Dumbbell size={28} className="text-primary" />
            </div>
            <div>
              <p className="font-black text-xl">No workout plan yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Set your goal and training preferences to get an AI-generated weekly workout plan tailored to you.
              </p>
            </div>
            <Link href="/workout/setup">
              <Button className="gradient-orange border-0 hover:opacity-90 h-12 px-8 rounded-2xl font-bold w-full text-white">
                Create Your Plan →
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto px-4 -mt-4 pb-24 space-y-3">

          {/* Start-day picker */}
          <div className="bg-card border border-border rounded-2xl px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Week starts on</p>
              {savingStart && <Loader2 size={12} className="animate-spin text-muted-foreground" />}
            </div>
            <div className="flex gap-1">
              {DAY_ABBREVS.map((abbrev, i) => (
                <button
                  key={abbrev}
                  type="button"
                  onClick={() => setStartDay(i)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    (plan.startDay ?? 0) === i
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {abbrev}
                </button>
              ))}
            </div>
          </div>

          {(() => {
            const rotated = rotatedSchedule(plan.schedule, plan.startDay ?? 0);
            const todayDay = rotated.find((_, i) => ((plan.startDay ?? 0) + i) % 7 === todayIndex);
            if (todayDay && !todayDay.isRest) {
              return (
                <Button
                  onClick={() => setSessionDay(todayDay)}
                  className="w-full gradient-orange border-0 hover:opacity-90 h-12 rounded-2xl font-bold gap-2"
                >
                  <Play size={16} /> Start today&apos;s workout
                </Button>
              );
            }
            return null;
          })()}

          {/* Rotated week */}
          {rotatedSchedule(plan.schedule, plan.startDay ?? 0).map((day, slotIndex) => {
            // Actual calendar day this slot falls on
            const calendarDay = ((plan.startDay ?? 0) + slotIndex) % 7;
            return (
              <DayCard
                key={day.dayIndex}
                day={{ ...day, dayName: DAY_ABBREVS[calendarDay] }}
                isToday={calendarDay === todayIndex}
              />
            );
          })}

          <div className="pt-4 text-center">
            <Link href="/workout/setup">
              <Button variant="outline" className="gap-2 rounded-2xl font-semibold h-11">
                <RotateCcw size={15} /> Regenerate Plan
              </Button>
            </Link>
          </div>
        </div>
      )}

      {sessionDay && (
        <WorkoutSessionLogger
          workoutName={sessionDay.workoutName}
          focus={sessionDay.focus}
          exercises={sessionDay.exercises.filter((e) => !e.isWarmup)}
          onClose={() => setSessionDay(null)}
        />
      )}
    </div>
  );
}
