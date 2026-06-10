import WorkoutSession from "@/models/WorkoutSession";

export interface SetLog {
  setNumber: number;
  weightLbs?: number;
  reps?: number;
  rpe?: number;
  completed: boolean;
}

export interface ExerciseLog {
  name: string;
  sets: SetLog[];
}

export function bestSetWeight(sets: SetLog[]): number {
  return sets.reduce((max, s) => Math.max(max, s.weightLbs ?? 0), 0);
}

export async function getLastSessionForWorkout(
  userId: string,
  workoutName: string,
  beforeDate: string
): Promise<{ exercises: ExerciseLog[] } | null> {
  const session = await WorkoutSession.findOne({
    userId,
    workoutName,
    date: { $lt: beforeDate },
    completedAt: { $exists: true },
  })
    .sort({ date: -1 })
    .lean();

  if (!session) return null;
  return { exercises: session.exercises as ExerciseLog[] };
}

export async function computePersonalRecords(
  userId: string,
  exercises: ExerciseLog[]
): Promise<Record<string, { weightLbs: number; isNewPr: boolean }>> {
  const history = await WorkoutSession.find({
    userId,
    completedAt: { $exists: true },
  })
    .sort({ date: -1 })
    .limit(50)
    .lean();

  const bestHistorical: Record<string, number> = {};
  for (const session of history) {
    for (const ex of session.exercises) {
      const w = bestSetWeight(ex.sets as SetLog[]);
      if (!bestHistorical[ex.name] || w > bestHistorical[ex.name]) {
        bestHistorical[ex.name] = w;
      }
    }
  }

  const result: Record<string, { weightLbs: number; isNewPr: boolean }> = {};
  for (const ex of exercises) {
    const current = bestSetWeight(ex.sets);
    const prior = bestHistorical[ex.name] ?? 0;
    result[ex.name] = {
      weightLbs: current,
      isNewPr: current > prior && current > 0,
    };
  }
  return result;
}

export function prefillFromLastSession(
  templateExercises: { name: string; sets: number }[],
  lastExercises: ExerciseLog[]
): ExerciseLog[] {
  const lastByName = new Map(lastExercises.map((e) => [e.name, e]));
  return templateExercises.map((ex) => {
    const last = lastByName.get(ex.name);
    return {
      name: ex.name,
      sets: Array.from({ length: ex.sets }, (_, i) => {
        const lastSet = last?.sets[i];
        return {
          setNumber: i + 1,
          weightLbs: lastSet?.weightLbs,
          reps: lastSet?.reps,
          completed: false,
        };
      }),
    };
  });
}
