import type { buildCoachingSnapshot } from "./coachingContext";

export type AdaptiveSignal = {
  estimatedExpenditure: number | null;
  weightTrendLbs: number | null;
  weeklyWeightChangeLbs: number | null;
  avgIntake: number | null;
  loggingRate: number;
  stallDetected: boolean;
  tooFastDetected: boolean;
  dataInsufficient: boolean;
  headline: string;
  focus: string;
  recommendation?: {
    type: "reduce_calories" | "increase_calories" | "adherence" | "none";
    deltaCalories?: number;
    rationale: string;
  };
};

export function computeAdaptiveSignals(
  snapshot: NonNullable<Awaited<ReturnType<typeof buildCoachingSnapshot>>>
): AdaptiveSignal {
  const { user, macros, recentCheckIns, adherence, estimatedExpenditure, weightTrend } = snapshot;
  const weighIns = recentCheckIns.filter((c) => c.weightLbs > 0);
  const loggingRate = adherence ? adherence.loggedDays / 7 : 0;

  const daysSpan = Math.max(1, recentCheckIns.length);
  const weeklyWeightChange =
    weightTrend !== null ? (weightTrend / daysSpan) * 7 : null;

  const avgIntake =
    adherence && adherence.loggedDays > 0
      ? Math.round(
          adherence.daily.filter((d) => d.logged).reduce((s, d) => s + d.calories, 0) /
            adherence.loggedDays
        )
      : null;

  const dataInsufficient = weighIns.length < 3;
  const goalType = user.goalType ?? "lose_fat";

  let stallDetected = false;
  let tooFastDetected = false;

  if (!dataInsufficient && weeklyWeightChange !== null) {
    if (goalType === "lose_fat" && Math.abs(weeklyWeightChange) < 0.3) {
      stallDetected = true;
    }
    if (user.weightLbs && weeklyWeightChange < -(user.weightLbs * 0.015)) {
      tooFastDetected = true;
    }
  }

  let headline = "Keep logging — your expenditure estimate updates weekly.";
  let focus = "Log weight and meals at least 5 days this week.";
  let recommendation: AdaptiveSignal["recommendation"];

  if (dataInsufficient) {
    headline = "Need more weigh-ins for adaptive targets";
    focus = "Weigh in at least 3 times over the next 2 weeks.";
  } else if (tooFastDetected && macros) {
    headline = "Losing faster than recommended";
    focus = "Prioritize recovery and protein — consider eating slightly more.";
    recommendation = {
      type: "increase_calories",
      deltaCalories: 200,
      rationale: `Trend is ~${weeklyWeightChange!.toFixed(1)} lbs/week. A modest +200 kcal protects lean mass.`,
    };
  } else if (stallDetected && loggingRate >= 0.5 && avgIntake !== null && macros) {
    if (avgIntake > macros.calories + 100) {
      headline = "Intake exceeds targets — adherence first";
      focus = "Hit your current targets before cutting further.";
      recommendation = {
        type: "adherence",
        rationale: `Logged intake averages ${avgIntake} kcal vs ${macros.calories} target.`,
      };
    } else {
      headline = "Plateau detected";
      focus = "Small deficit adjustment or +2k daily steps.";
      recommendation = {
        type: "reduce_calories",
        deltaCalories: -100,
        rationale: `Weight flat ~${Math.abs(weeklyWeightChange!).toFixed(1)} lbs/week with solid logging.`,
      };
    }
  } else if (estimatedExpenditure && macros) {
    const gap = estimatedExpenditure - macros.calories;
    if (Math.abs(gap) > 150) {
      headline = `Estimated expenditure ~${estimatedExpenditure} kcal/day`;
      focus =
        gap > 0
          ? "Your body may be burning more than your current target."
          : "Targets align closely with estimated expenditure.";
    } else {
      headline = "On track with estimated expenditure";
      focus = "Maintain consistency this week.";
    }
  }

  return {
    estimatedExpenditure: estimatedExpenditure ?? null,
    weightTrendLbs: weightTrend,
    weeklyWeightChangeLbs: weeklyWeightChange,
    avgIntake,
    loggingRate: Math.round(loggingRate * 100),
    stallDetected,
    tooFastDetected,
    dataInsufficient,
    headline,
    focus,
    recommendation,
  };
}
