export type ActivityLevel =
  | "sedentary"
  | "lightly_active"
  | "moderately_active"
  | "very_active"
  | "extremely_active";

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extremely_active: 1.9,
};

export interface PhysiqueInput {
  weightLbs: number;
  bodyFatPercent: number;
  heightInches: number;
  age: number;
  sex: "male" | "female";
  activityLevel: ActivityLevel;
  goalType: "lose_fat" | "maintain" | "build_muscle";
  goalBodyFatPercent?: number;
}

export interface PhysiqueResult {
  leanBodyMassLbs: number;
  fatMassLbs: number;
  maintenanceCalories: number;
  goalWeightLbs: number;
  weeklyFatLossLbs: number;
  targetCalories: number;
  weeksToGoal: number;
}

export function calculatePhysique(input: PhysiqueInput): PhysiqueResult {
  const fatFraction = input.bodyFatPercent / 100;
  const leanBodyMassLbs = input.weightLbs * (1 - fatFraction);
  const fatMassLbs = input.weightLbs * fatFraction;

  // Mifflin-St Jeor in lbs/inches
  const weightKg = input.weightLbs * 0.453592;
  const heightCm = input.heightInches * 2.54;
  const bmr =
    input.sex === "male"
      ? 10 * weightKg + 6.25 * heightCm - 5 * input.age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * input.age - 161;

  const maintenanceCalories = Math.round(bmr * ACTIVITY_MULTIPLIERS[input.activityLevel]);

  const goalBF = input.goalBodyFatPercent ?? (input.goalType === "lose_fat" ? 10 : input.bodyFatPercent);
  const goalWeightLbs = leanBodyMassLbs / (1 - goalBF / 100);
  const fatToLoseLbs = Math.max(0, input.weightLbs - goalWeightLbs);

  // Target ~0.5–1% bodyweight/week deficit; cap deficit at 750 kcal
  const weeklyFatLossLbs = input.goalType === "lose_fat" ? Math.min(1, input.weightLbs * 0.01) : 0;
  const dailyDeficit = weeklyFatLossLbs * 3500 / 7;
  const targetCalories =
    input.goalType === "lose_fat"
      ? Math.round(maintenanceCalories - dailyDeficit)
      : input.goalType === "build_muscle"
      ? Math.round(maintenanceCalories + 300)
      : maintenanceCalories;

  const weeksToGoal = weeklyFatLossLbs > 0 ? Math.ceil(fatToLoseLbs / weeklyFatLossLbs) : 0;

  return {
    leanBodyMassLbs: Math.round(leanBodyMassLbs * 10) / 10,
    fatMassLbs: Math.round(fatMassLbs * 10) / 10,
    maintenanceCalories,
    goalWeightLbs: Math.round(goalWeightLbs * 10) / 10,
    weeklyFatLossLbs: Math.round(weeklyFatLossLbs * 10) / 10,
    targetCalories,
    weeksToGoal,
  };
}

export interface MacroResult {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export function calculateMacros(targetCalories: number, leanBodyMassLbs: number): MacroResult {
  const proteinG = Math.round(leanBodyMassLbs * 1.3); // midpoint of 1.2–1.4
  const fatCalories = Math.round(targetCalories * 0.25); // 25% of cals
  const fatG = Math.round(fatCalories / 9);
  const remainingCalories = targetCalories - proteinG * 4 - fatCalories;
  const carbsG = Math.max(0, Math.round(remainingCalories / 4));

  return { calories: targetCalories, proteinG, carbsG, fatG };
}
