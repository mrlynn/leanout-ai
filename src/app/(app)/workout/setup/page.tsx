"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronRight, CheckCircle2, Circle, RotateCcw } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────

interface Preferences {
  equipment: string;
  workoutsPerWeek: number;
  durationMinutes: number;
  experienceLevel: string;
  split: string;
  warmupSets: boolean;
  circuits: boolean;
}

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

type Step = "goal" | "preferences" | "generating" | "review";

// ── Constants ──────────────────────────────────────────────────────

const GOALS = [
  { id: "build_muscle",      label: "Build Muscle",            desc: "Build lean muscle with the right balance of volume, intensity, and recovery",                 emoji: "💪" },
  { id: "get_lean",          label: "Get Lean",                desc: "Maintain and build lean muscle definition while reducing body fat through smart training",     emoji: "🔥" },
  { id: "get_stronger",      label: "Get Stronger",            desc: "Lift heavier, master key movements, and build lasting strength",                              emoji: "🏋️" },
  { id: "reduce_bodyweight", label: "Reduce Bodyweight",       desc: "Increase calorie burn and stamina with higher-rep, circuit-style strength sessions",           emoji: "⚡" },
  { id: "improve_fitness",   label: "Improve Fitness",         desc: "Enhance overall fitness and everyday strength with balanced training",                         emoji: "🏃" },
  { id: "powerlifting",      label: "Practice Powerlifting",   desc: "Build maximum strength using the squat, bench press, and deadlift as your core lifts",        emoji: "🥇" },
];

const COMMON_GOALS = GOALS.slice(0, 3);
const OTHER_GOALS  = GOALS.slice(3);

const EQUIPMENT_OPTIONS = [
  { id: "full_gym",    label: "Full Gym" },
  { id: "home_gym",   label: "Home Gym" },
  { id: "bodyweight", label: "Bodyweight Only" },
];

const SPLIT_OPTIONS = [
  { id: "full_body",       label: "Full Body" },
  { id: "upper_lower",     label: "Upper/Lower" },
  { id: "push_pull_legs",  label: "Push/Pull/Legs" },
  { id: "bro_split",       label: "Bro Split" },
  { id: "powerlifting",    label: "Powerlifting" },
];

const FOCUS_COLORS: Record<string, string> = {
  Push:       "bg-blue-100 text-blue-700",
  Pull:       "bg-green-100 text-green-700",
  Legs:       "bg-orange-100 text-orange-700",
  Upper:      "bg-indigo-100 text-indigo-700",
  Lower:      "bg-teal-100 text-teal-700",
  "Full Body":"bg-violet-100 text-violet-700",
  Cardio:     "bg-red-100 text-red-700",
  Rest:       "bg-muted text-muted-foreground",
};

function focusBadge(focus: string) {
  return FOCUS_COLORS[focus] ?? "bg-muted text-muted-foreground";
}

const GENERATING_MESSAGES = [
  "Analyzing your training goals…",
  "Selecting optimal exercises…",
  "Programming your weekly split…",
  "Calculating volume and intensity…",
  "Finalizing your plan…",
];

// ── Goal Step ──────────────────────────────────────────────────────

function GoalStep({ selected, onSelect, onNext }: { selected: string; onSelect: (id: string) => void; onNext: () => void }) {
  function GoalCard({ goal }: { goal: typeof GOALS[0] }) {
    const active = selected === goal.id;
    return (
      <button
        type="button"
        onClick={() => onSelect(goal.id)}
        className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all text-left ${
          active
            ? "border-primary bg-primary/5"
            : "border-border bg-card hover:border-primary/40 hover:bg-muted/40"
        }`}
      >
        <span className="text-2xl">{goal.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">{goal.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{goal.desc}</p>
        </div>
        {active
          ? <CheckCircle2 size={20} className="text-primary shrink-0" />
          : <Circle size={20} className="text-muted-foreground/40 shrink-0" />
        }
      </button>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Common Goals</p>
        <div className="space-y-2">
          {COMMON_GOALS.map((g) => <GoalCard key={g.id} goal={g} />)}
        </div>
      </div>
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Other Goals</p>
        <div className="space-y-2">
          {OTHER_GOALS.map((g) => <GoalCard key={g.id} goal={g} />)}
        </div>
      </div>
      <Button
        onClick={onNext}
        disabled={!selected}
        className="w-full gradient-orange border-0 hover:opacity-90 h-12 rounded-2xl font-bold text-white"
      >
        Continue <ChevronRight size={16} className="ml-1" />
      </Button>
    </div>
  );
}

// ── Preferences Step ───────────────────────────────────────────────

function PrefsStep({
  prefs,
  onChange,
  onBack,
  onGenerate,
}: {
  prefs: Preferences;
  onChange: (p: Preferences) => void;
  onBack: () => void;
  onGenerate: () => void;
}) {
  function set<K extends keyof Preferences>(key: K, val: Preferences[K]) {
    onChange({ ...prefs, [key]: val });
  }

  function SectionLabel({ label }: { label: string }) {
    return <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 mt-5">{label}</p>;
  }

  function OptionRow<T extends string | number>({ label, options, value, onPick }: {
    label: string;
    options: { id: T; label: string }[];
    value: T;
    onPick: (v: T) => void;
  }) {
    return (
      <div className="bg-card border border-border rounded-2xl px-4 py-3 space-y-2">
        <p className="text-sm font-semibold">{label}</p>
        <div className="flex flex-wrap gap-2">
          {options.map((o) => (
            <button
              key={String(o.id)}
              type="button"
              onClick={() => onPick(o.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                value === o.id
                  ? "bg-primary text-white border-primary"
                  : "bg-muted text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  function ToggleRow({ label, value, onToggle }: { label: string; value: boolean; onToggle: () => void }) {
    return (
      <div className="bg-card border border-border rounded-2xl px-4 py-3.5 flex items-center justify-between">
        <p className="text-sm font-semibold">{label}</p>
        <button
          type="button"
          onClick={onToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            value ? "bg-primary" : "bg-muted"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              value ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <SectionLabel label="Equipment" />
      <OptionRow
        label="Equipment Available"
        options={EQUIPMENT_OPTIONS}
        value={prefs.equipment}
        onPick={(v) => set("equipment", v)}
      />
      <ToggleRow
        label="Bodyweight Only"
        value={prefs.equipment === "bodyweight"}
        onToggle={() => set("equipment", prefs.equipment === "bodyweight" ? "full_gym" : "bodyweight")}
      />

      <SectionLabel label="Training Profile" />
      <OptionRow
        label="Workouts Per Week"
        options={[3, 4, 5, 6].map((n) => ({ id: n as number, label: `${n}x` }))}
        value={prefs.workoutsPerWeek}
        onPick={(v) => set("workoutsPerWeek", v)}
      />
      <OptionRow
        label="Session Duration"
        options={[30, 45, 60, 75, 90].map((n) => ({ id: n as number, label: `${n} min` }))}
        value={prefs.durationMinutes}
        onPick={(v) => set("durationMinutes", v)}
      />
      <OptionRow
        label="Experience Level"
        options={[
          { id: "beginner",     label: "Beginner" },
          { id: "intermediate", label: "Intermediate" },
          { id: "advanced",     label: "Advanced" },
        ]}
        value={prefs.experienceLevel}
        onPick={(v) => set("experienceLevel", v)}
      />

      <SectionLabel label="Training Format" />
      <OptionRow
        label="Training Split"
        options={SPLIT_OPTIONS}
        value={prefs.split}
        onPick={(v) => set("split", v)}
      />
      <ToggleRow label="Warm-Up Sets" value={prefs.warmupSets} onToggle={() => set("warmupSets", !prefs.warmupSets)} />
      <ToggleRow label="Circuits &amp; Supersets" value={prefs.circuits} onToggle={() => set("circuits", !prefs.circuits)} />

      <div className="pt-4 flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1 h-12 rounded-2xl font-bold">
          Back
        </Button>
        <Button
          onClick={onGenerate}
          className="flex-[2] gradient-orange border-0 hover:opacity-90 h-12 rounded-2xl font-bold text-white"
        >
          Generate My Plan
        </Button>
      </div>
    </div>
  );
}

// ── Review Step ────────────────────────────────────────────────────

function ReviewStep({
  goal,
  prefs,
  schedule,
  onSave,
  onRegenerate,
  saving,
}: {
  goal: string;
  prefs: Preferences;
  schedule: WorkoutDay[];
  onSave: () => void;
  onRegenerate: () => void;
  saving: boolean;
}) {
  const goalLabel = GOALS.find((g) => g.id === goal)?.label ?? goal;
  const trainingDays = schedule.filter((d) => !d.isRest);

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <p className="font-black text-base">Your Plan Summary</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Goal</p>
            <p className="font-semibold">{goalLabel}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Workouts/Week</p>
            <p className="font-semibold">{prefs.workoutsPerWeek}x</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Duration</p>
            <p className="font-semibold">{prefs.durationMinutes} min</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Experience</p>
            <p className="font-semibold capitalize">{prefs.experienceLevel}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Split</p>
            <p className="font-semibold">{SPLIT_OPTIONS.find((s) => s.id === prefs.split)?.label ?? prefs.split}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Equipment</p>
            <p className="font-semibold">{EQUIPMENT_OPTIONS.find((e) => e.id === prefs.equipment)?.label ?? prefs.equipment}</p>
          </div>
        </div>
      </div>

      {/* Week schedule */}
      <div className="space-y-2">
        {schedule.map((day) => (
          <div
            key={day.dayIndex}
            className={`bg-card border rounded-2xl px-4 py-3.5 flex items-center gap-3 ${
              day.isRest ? "border-border opacity-60" : "border-border"
            }`}
          >
            <div className="w-12 shrink-0">
              <p className="text-xs font-bold text-muted-foreground">{day.dayName.slice(0, 3).toUpperCase()}</p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{day.isRest ? "Rest Day" : day.workoutName}</p>
              {!day.isRest && (
                <p className="text-xs text-muted-foreground mt-0.5">{day.estimatedMinutes} min · {day.exercises.length} exercises</p>
              )}
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-xl ${focusBadge(day.focus)}`}>
              {day.focus}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-center text-muted-foreground">
        {trainingDays.length} training days · {schedule.filter((d) => d.isRest).length} rest days
      </p>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onRegenerate} className="flex-1 h-12 rounded-2xl font-bold gap-2">
          <RotateCcw size={15} /> Regenerate
        </Button>
        <Button
          onClick={onSave}
          disabled={saving}
          className="flex-[2] gradient-orange border-0 hover:opacity-90 h-12 rounded-2xl font-bold text-white"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : "Save & Start Training →"}
        </Button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────

export default function WorkoutSetupPage() {
  const router = useRouter();
  const [step, setStep]           = useState<Step>("goal");
  const [goal, setGoal]           = useState("build_muscle");
  const [prefs, setPrefs]         = useState<Preferences>({
    equipment: "full_gym",
    workoutsPerWeek: 4,
    durationMinutes: 60,
    experienceLevel: "intermediate",
    split: "push_pull_legs",
    warmupSets: true,
    circuits: false,
  });
  const [schedule, setSchedule]   = useState<WorkoutDay[]>([]);
  const [genMsg, setGenMsg]       = useState(0);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // Cycle messages during generation
  useEffect(() => {
    if (step !== "generating") return;
    const id = setInterval(() => setGenMsg((m) => (m + 1) % GENERATING_MESSAGES.length), 2200);
    return () => clearInterval(id);
  }, [step]);

  async function generate() {
    setStep("generating");
    setError(null);
    try {
      const res = await fetch("/api/workout/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, preferences: prefs }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      setSchedule(data.schedule ?? []);
      setStep("review");
    } catch {
      setError("Something went wrong generating your plan. Please try again.");
      setStep("preferences");
    }
  }

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/workout/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, preferences: prefs, schedule }),
      });
      router.push("/workout");
    } catch {
      setError("Failed to save. Please try again.");
      setSaving(false);
    }
  }

  const stepTitle: Record<Step, string> = {
    goal:       "Choose Your Goal",
    preferences:"Training Preferences",
    generating: "Generating…",
    review:     "Your Training Plan",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-orange px-6 pt-10 pb-10 md:pt-12">
        <div className="max-w-2xl mx-auto">
          <p className="text-orange-200 text-sm font-medium">AI Workout Planner</p>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">{stepTitle[step]}</h1>
          {step !== "generating" && step !== "review" && (
            <div className="flex gap-2 mt-4">
              {(["goal", "preferences"] as const).map((s, i) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full flex-1 transition-all ${
                    step === s || (i === 0 && step !== "goal") ? "bg-white" : "bg-white/30"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {step === "goal" && (
          <GoalStep selected={goal} onSelect={setGoal} onNext={() => setStep("preferences")} />
        )}

        {step === "preferences" && (
          <PrefsStep
            prefs={prefs}
            onChange={setPrefs}
            onBack={() => setStep("goal")}
            onGenerate={generate}
          />
        )}

        {step === "generating" && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full gradient-orange opacity-20 animate-ping absolute inset-0" />
              <div className="w-20 h-20 rounded-full gradient-orange flex items-center justify-center relative">
                <Loader2 size={32} className="text-white animate-spin" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="font-black text-xl">Building your personalized training plan…</p>
              <p className="text-muted-foreground text-sm transition-all">{GENERATING_MESSAGES[genMsg]}</p>
            </div>
          </div>
        )}

        {step === "review" && schedule.length > 0 && (
          <ReviewStep
            goal={goal}
            prefs={prefs}
            schedule={schedule}
            onSave={save}
            onRegenerate={generate}
            saving={saving}
          />
        )}
      </div>
    </div>
  );
}
