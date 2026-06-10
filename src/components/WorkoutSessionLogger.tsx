"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, X, Check, Trophy, Timer } from "lucide-react";
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
  rpe?: number;
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
  const [hints, setHints] = useState<Record<string, string>>({});
  const [prs, setPrs] = useState<Record<string, boolean>>({});
  const [restSeconds, setRestSeconds] = useState(0);
  const [restActive, setRestActive] = useState(false);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadSession = useCallback(async () => {
    const date = getDateString();
    const res = await fetch(
      `/api/workout/session?date=${date}&workoutName=${encodeURIComponent(workoutName)}`
    );
    const data = await res.json();
    setHints(data.progressionHints ?? {});

    const lastMap = new Map<string, ExerciseLog>(
      (data.lastSession?.exercises ?? []).map((e: ExerciseLog) => [e.name, e])
    );

    setExerciseLogs(
      exercises.map((ex) => {
        const last = lastMap.get(ex.name);
        return {
          name: ex.name,
          sets: Array.from({ length: ex.sets }, (_, i) => {
            const ls = last?.sets[i];
            return {
              setNumber: i + 1,
              weightLbs: ls?.weightLbs,
              reps: ls?.reps,
              completed: false,
            };
          }),
        };
      })
    );
  }, [exercises, workoutName]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    return () => {
      if (restRef.current) clearInterval(restRef.current);
    };
  }, []);

  function startRest(seconds = 90) {
    if (restRef.current) clearInterval(restRef.current);
    setRestSeconds(seconds);
    setRestActive(true);
    restRef.current = setInterval(() => {
      setRestSeconds((s) => {
        if (s <= 1) {
          if (restRef.current) clearInterval(restRef.current);
          setRestActive(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  function updateSet(
    exIdx: number,
    setIdx: number,
    field: "weightLbs" | "reps" | "rpe" | "completed",
    value: number | boolean
  ) {
    setExerciseLogs((prev) => {
      const next = [...prev];
      const sets = [...next[exIdx].sets];
      sets[setIdx] = { ...sets[setIdx], [field]: value };

      if (field === "weightLbs" || field === "reps") {
        for (let i = setIdx + 1; i < sets.length; i++) {
          if (sets[i][field] == null || sets[i][field] === 0) {
            sets[i] = { ...sets[i], [field]: value as number };
          }
        }
      }

      if (field === "completed" && value === true) {
        startRest(90);
      }

      next[exIdx] = { ...next[exIdx], sets };
      return next;
    });
  }

  async function finish(complete: boolean) {
    setSaving(true);
    const durationMinutes = Math.round((Date.now() - startTime) / 60000);
    const res = await fetch("/api/workout/session", {
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
    const data = await res.json();
    if (data.personalRecords) {
      const newPrs: Record<string, boolean> = {};
      for (const [name, pr] of Object.entries(data.personalRecords as Record<string, { isNewPr: boolean }>)) {
        if (pr.isNewPr) newPrs[name] = true;
      }
      setPrs(newPrs);
    }
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

        {restActive && (
          <div className="bg-blue-50 px-6 py-2 flex items-center gap-2 text-sm font-bold text-blue-700">
            <Timer size={14} />
            Rest {restSeconds}s
            <button type="button" className="ml-auto text-xs underline" onClick={() => setRestActive(false)}>
              Skip
            </button>
          </div>
        )}

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-6">
          {exerciseLogs.map((ex, exIdx) => (
            <div key={ex.name}>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold text-sm">{ex.name}</p>
                {prs[ex.name] && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                    <Trophy size={12} /> PR
                  </span>
                )}
              </div>
              {hints[ex.name] && (
                <p className="text-xs text-muted-foreground mb-2">{hints[ex.name]}</p>
              )}
              <div className="space-y-2">
                {ex.sets.map((set, setIdx) => (
                  <div key={set.setNumber} className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground w-8">#{set.setNumber}</span>
                    <Input
                      type="number"
                      placeholder="lbs"
                      className="w-20 h-9"
                      value={set.weightLbs ?? ""}
                      onChange={(e) =>
                        updateSet(exIdx, setIdx, "weightLbs", parseFloat(e.target.value) || 0)
                      }
                    />
                    <Input
                      type="number"
                      placeholder="reps"
                      className="w-16 h-9"
                      value={set.reps ?? ""}
                      onChange={(e) =>
                        updateSet(exIdx, setIdx, "reps", parseInt(e.target.value) || 0)
                      }
                    />
                    <Input
                      type="number"
                      placeholder="RPE"
                      className="w-14 h-9"
                      min={1}
                      max={10}
                      value={set.rpe ?? ""}
                      onChange={(e) =>
                        updateSet(exIdx, setIdx, "rpe", parseInt(e.target.value) || 0)
                      }
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
          <Button
            onClick={() => finish(true)}
            disabled={saving}
            className="flex-1 gradient-orange border-0 rounded-2xl font-bold hover:opacity-90"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : "Finish workout"}
          </Button>
        </div>
      </div>
    </div>
  );
}
