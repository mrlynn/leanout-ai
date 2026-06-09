"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, X, Check } from "lucide-react";
import { getDateString } from "@/lib/foodLog";

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  isWarmup: boolean;
}

interface SetLog {
  setNumber: number;
  weightLbs?: number;
  reps?: number;
  completed: boolean;
}

interface ExerciseLog {
  name: string;
  sets: SetLog[];
}

export function WorkoutSessionLogger({
  workoutName,
  focus,
  exercises,
  onClose,
  onComplete,
}: {
  workoutName: string;
  focus: string;
  exercises: Exercise[];
  onClose: () => void;
  onComplete?: () => void;
}) {
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [saving, setSaving] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    setExerciseLogs(
      exercises.map((ex) => ({
        name: ex.name,
        sets: Array.from({ length: ex.sets }, (_, i) => ({
          setNumber: i + 1,
          completed: false,
        })),
      }))
    );
  }, [exercises]);

  function updateSet(exIdx: number, setIdx: number, field: "weightLbs" | "reps" | "completed", value: number | boolean) {
    setExerciseLogs((prev) => {
      const next = [...prev];
      const sets = [...next[exIdx].sets];
      sets[setIdx] = { ...sets[setIdx], [field]: value };
      next[exIdx] = { ...next[exIdx], sets };
      return next;
    });
  }

  async function finish(complete: boolean) {
    setSaving(true);
    const durationMinutes = Math.round((Date.now() - startTime) / 60000);
    await fetch("/api/workout/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: getDateString(),
        workoutName,
        focus,
        exercises: exerciseLogs,
        durationMinutes,
        complete,
      }),
    });
    setSaving(false);
    if (complete) onComplete?.();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden card-shadow-md flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="gradient-orange px-6 py-5 flex items-center justify-between shrink-0">
          <div>
            <p className="text-orange-200 text-xs font-bold uppercase tracking-widest">{focus}</p>
            <p className="text-white font-black text-lg">{workoutName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10">
            <X size={18} className="text-white" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-6">
          {exerciseLogs.map((ex, exIdx) => (
            <div key={ex.name}>
              <p className="font-bold text-sm mb-3">{ex.name}</p>
              <div className="space-y-2">
                {ex.sets.map((set, setIdx) => (
                  <div key={set.setNumber} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-8">#{set.setNumber}</span>
                    <Input
                      type="number"
                      placeholder="lbs"
                      className="w-20 h-9"
                      value={set.weightLbs ?? ""}
                      onChange={(e) => updateSet(exIdx, setIdx, "weightLbs", parseFloat(e.target.value) || 0)}
                    />
                    <Input
                      type="number"
                      placeholder="reps"
                      className="w-16 h-9"
                      value={set.reps ?? ""}
                      onChange={(e) => updateSet(exIdx, setIdx, "reps", parseInt(e.target.value) || 0)}
                    />
                    <button
                      type="button"
                      onClick={() => updateSet(exIdx, setIdx, "completed", !set.completed)}
                      className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-all ${
                        set.completed ? "bg-green-500 border-green-500 text-white" : "border-border"
                      }`}
                    >
                      <Check size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-border flex gap-3 shrink-0">
          <Button variant="outline" onClick={() => finish(false)} disabled={saving} className="flex-1 rounded-2xl">
            Save draft
          </Button>
          <Button onClick={() => finish(true)} disabled={saving} className="flex-1 gradient-orange border-0 rounded-2xl font-bold hover:opacity-90">
            {saving ? <Loader2 className="animate-spin" size={16} /> : "Finish workout"}
          </Button>
        </div>
      </div>
    </div>
  );
}
