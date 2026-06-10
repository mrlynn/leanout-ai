import User from "@/models/User";
import DailyCheckIn from "@/models/DailyCheckIn";
import FoodLogEntry from "@/models/FoodLogEntry";
import WorkoutPlan from "@/models/WorkoutPlan";
import { aggregateDayTotals, getDateString, formatFoodLogSummaryForPrompt, type FoodLogSummary } from "@/lib/foodLog";
import { getFoodLogSummary } from "@/lib/foodLogServer";
import { physiqueFromUser, macrosFromUser } from "@/lib/physique";
import { getMacroAdherence, estimateExpenditure } from "@/lib/macroAdherence";

export interface CoachBrief {
  headline: string;
  insights: string[];
  priority: "info" | "warning" | "success";
  coachPrompt?: string;
}

function daysUntil(date?: Date | null) {
  if (!date) return null;
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / (86400000));
}

export async function buildCoachingSnapshot(userId: string) {
  const user = await User.findById(userId).lean();
  if (!user) return null;

  const physique = physiqueFromUser(user);
  const macros = macrosFromUser(user);

  const [recentCheckIns, workoutPlan, todayFood, foodLogSummary] = await Promise.all([
    DailyCheckIn.find({ userId }).sort({ date: -1 }).limit(14).lean(),
    WorkoutPlan.findOne({ userId }).lean(),
    FoodLogEntry.find({ userId, date: getDateString() }).lean(),
    getFoodLogSummary(userId, 14),
  ]);

  const adherence = macros
    ? await getMacroAdherence(userId, {
        calories: macros.calories,
        proteinG: macros.proteinG,
        carbsG: macros.carbsG,
        fatG: macros.fatG,
      })
    : null;

  const todayIntake = aggregateDayTotals(todayFood);
  const avgWeight =
    recentCheckIns.length > 0
      ? recentCheckIns.reduce((s, c) => s + c.weightLbs, 0) / recentCheckIns.length
      : null;

  const weightTrend =
    recentCheckIns.length >= 2
      ? recentCheckIns[0].weightLbs - recentCheckIns[recentCheckIns.length - 1].weightLbs
      : null;

  const avgCompliance =
    recentCheckIns.length > 0
      ? recentCheckIns.reduce((s, c) => s + c.compliance, 0) / recentCheckIns.length
      : null;

  const workoutsLast7 = recentCheckIns.filter((c) => c.workoutCompleted).length;

  const avgIntake =
    adherence && adherence.loggedDays > 0
      ? Math.round(adherence.daily.filter((d) => d.logged).reduce((s, d) => s + d.calories, 0) / adherence.loggedDays)
      : null;

  const estimatedExpenditure =
    avgIntake !== null && weightTrend !== null
      ? estimateExpenditure(avgIntake, weightTrend, Math.min(14, recentCheckIns.length))
      : null;

  const goalDays = daysUntil(user.goalDate);
  const vacationDays = daysUntil(user.vacationDate);

  const today = new Date();
  const todayIdx = (today.getDay() + 6) % 7;
  const rotated = workoutPlan
    ? [...workoutPlan.schedule.slice(workoutPlan.startDay), ...workoutPlan.schedule.slice(0, workoutPlan.startDay)]
    : [];
  const todayWorkout = rotated[todayIdx];

  return {
    user,
    physique,
    macros,
    recentCheckIns,
    adherence,
    todayIntake,
    avgWeight,
    weightTrend,
    avgCompliance,
    workoutsLast7,
    estimatedExpenditure,
    goalDays,
    vacationDays,
    todayWorkout,
    workoutPlan,
    foodLogSummary,
  };
}

export function generateCoachBrief(snapshot: NonNullable<Awaited<ReturnType<typeof buildCoachingSnapshot>>>): CoachBrief {
  const insights: string[] = [];
  let priority: CoachBrief["priority"] = "info";
  let headline = "You're on track — keep logging daily.";
  let coachPrompt: string | undefined;

  const { adherence, weightTrend, avgCompliance, goalDays, vacationDays, todayIntake, macros, workoutsLast7 } = snapshot;

  if (adherence) {
    if (adherence.proteinHitRate < 50) {
      insights.push(`Protein target hit only ${adherence.proteinHitRate}% of days this week.`);
      priority = "warning";
      headline = "Protein is lagging — small swaps can fix this.";
      coachPrompt = "My protein has been low this week. What are 2-3 easy high-protein meals I can add?";
    } else if (adherence.proteinHitRate >= 80) {
      insights.push(`Strong protein adherence: ${adherence.proteinHitRate}% of days on target.`);
      priority = "success";
    }

    if (adherence.loggedDays < 4) {
      insights.push(`Food logged ${adherence.loggedDays}/7 days — more data improves coaching accuracy.`);
      if (priority === "info") {
        headline = "Log more meals this week for sharper insights.";
        priority = "warning";
      }
    }
  }

  if (weightTrend !== null && recentCheckInsSpan(snapshot) >= 7) {
    const weeklyRate = weightTrend / Math.min(14, snapshot.recentCheckIns.length) * 7;
    if (Math.abs(weeklyRate) < 0.3 && snapshot.user.goalType === "lose_fat") {
      insights.push("Weight trend is flat over the last 2 weeks.");
      priority = "warning";
      headline = "Plateau detected — time to adjust.";
      coachPrompt = coachPrompt ?? "My weight hasn't changed in 2 weeks. What should I adjust?";
    } else if (weeklyRate < -0.5) {
      insights.push(`Losing ~${Math.abs(weeklyRate).toFixed(1)} lbs/week — solid pace.`);
    }
  }

  if (avgCompliance !== null && avgCompliance < 7) {
    insights.push(`Avg compliance ${avgCompliance.toFixed(1)}/10 — focus on adherence before cutting calories.`);
  }

  if (goalDays !== null && goalDays > 0 && goalDays <= 21) {
    insights.push(`${goalDays} days until your goal date.`);
  }

  if (vacationDays !== null && vacationDays > 0 && vacationDays <= 14) {
    insights.push(`Vacation in ${vacationDays} days — plan your approach now.`);
    coachPrompt = coachPrompt ?? "I have a vacation coming up. How should I prepare?";
  }

  if (macros && todayIntake.calories > 0) {
    const proteinLeft = Math.max(0, macros.proteinG - todayIntake.protein);
    if (proteinLeft > 20) {
      insights.push(`${Math.round(proteinLeft)}g protein remaining today.`);
    }
  }

  if (workoutsLast7 < 2) {
    insights.push(`Only ${workoutsLast7} workouts logged in the last 7 days.`);
  }

  if (insights.length === 0) {
    insights.push("Log a check-in and meals today to unlock personalized insights.");
  }

  return { headline, insights: insights.slice(0, 4), priority, coachPrompt };
}

function recentCheckInsSpan(snapshot: NonNullable<Awaited<ReturnType<typeof buildCoachingSnapshot>>>) {
  return snapshot.recentCheckIns.length;
}

export async function buildCoachSystemPromptFromSnapshot(
  snapshot: NonNullable<Awaited<ReturnType<typeof buildCoachingSnapshot>>>
) {
  const { user, physique, macros, recentCheckIns, adherence, avgWeight, weightTrend, avgCompliance, goalDays, vacationDays, todayWorkout, estimatedExpenditure, foodLogSummary } = snapshot;

  const weightTrendStr =
    weightTrend !== null ? (weightTrend <= 0 ? weightTrend.toFixed(1) : `+${weightTrend.toFixed(1)}`) : "N/A";

  return `You are an expert AI physique coach for LeanOut AI. You give direct, data-driven, actionable advice.

CLIENT PROFILE:
- Name: ${user.name}
- Age: ${user.age}, Sex: ${user.sex}
- Current weight: ${user.weightLbs} lbs, Body fat: ${user.bodyFatPercent}%
- Goal: ${user.goalType?.replace("_", " ")} → ${physique?.goalWeightLbs} lbs
- Timeline: ~${physique?.weeksToGoal} weeks
${goalDays !== null && goalDays > 0 ? `- Goal date: ${goalDays} days away` : ""}
${vacationDays !== null && vacationDays > 0 ? `- Vacation: ${vacationDays} days away` : ""}
- Lean body mass: ${physique?.leanBodyMassLbs} lbs
- Activity: ${user.activityLevel?.replace(/_/g, " ")}, Training ${user.trainingFrequency}x/week
${user.onTRT ? "- On TRT" : ""}
${user.foodPreferences ? `- Food preferences: ${user.foodPreferences}` : ""}
${user.allergies ? `- Allergies: ${user.allergies}` : ""}
${user.supplements ? `- Supplements: ${user.supplements}` : ""}

DAILY TARGETS:
- Calories: ${physique?.targetCalories} kcal (maintenance: ${physique?.maintenanceCalories})
- Protein: ${macros?.proteinG}g | Carbs: ${macros?.carbsG}g | Fat: ${macros?.fatG}g
- Target loss: ${physique?.weeklyFatLossLbs} lbs/week
${estimatedExpenditure ? `- Estimated expenditure (from logs): ~${estimatedExpenditure} kcal/day` : ""}

${macros ? formatFoodLogSummaryForPrompt(foodLogSummary, { calories: macros.calories, protein: macros.proteinG, carbs: macros.carbsG, fat: macros.fatG }) : "## Food Log\n(no macro targets set yet)"}

NUTRITION SUMMARY (last 7 days):
${adherence ? `- Protein on target ${adherence.proteinHitDays}/7 days
- Calories in range ${adherence.calorieHitDays}/7 days` : "- No food log data"}

RECENT PROGRESS (last ${recentCheckIns.length} check-ins):
${recentCheckIns.length > 0 ? `- Avg weight: ${avgWeight?.toFixed(1)} lbs
- Weight change over period: ${weightTrendStr} lbs
- Avg compliance: ${avgCompliance?.toFixed(1)}/10
- Latest: ${recentCheckIns[0].weightLbs} lbs, compliance ${recentCheckIns[0].compliance}/10` : "- No check-ins yet"}

TRAINING:
${todayWorkout ? `- Today: ${todayWorkout.isRest ? "Rest day" : todayWorkout.workoutName}` : "- No workout plan"}

COACHING STYLE:
- Be concise and specific. Use numbers. Skip pleasantries.
- When weight loss has stalled (< 0.3 lbs/week avg), recommend reducing calories by 100-150/day OR adding 20 min cardio 3x/week.
- When compliance is low (<7), focus on adherence strategies before adjusting targets.
- Reference their actual data when giving recommendations.
- Keep responses under 150 words unless a detailed plan is explicitly requested.`;
}
