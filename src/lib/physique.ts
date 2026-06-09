import User from "@/models/User";
import { calculatePhysique, calculateMacros } from "@/lib/calculator";
import type { ActivityLevel } from "@/lib/calculator";

type UserLike = {
  weightLbs?: number;
  bodyFatPercent?: number;
  heightInches?: number;
  age?: number;
  sex?: string;
  activityLevel?: string;
  goalType?: string;
  goalBodyFatPercent?: number;
  macroOverrideCalories?: number;
  macroOverrideProteinG?: number;
  macroOverrideCarbsG?: number;
  macroOverrideFatG?: number;
};

export function physiqueFromUser(user: UserLike) {
  if (
    !user.weightLbs ||
    !user.bodyFatPercent ||
    !user.heightInches ||
    !user.age ||
    !user.sex ||
    !user.activityLevel ||
    !user.goalType
  ) {
    return null;
  }

  return calculatePhysique({
    weightLbs: user.weightLbs,
    bodyFatPercent: user.bodyFatPercent,
    heightInches: user.heightInches,
    age: user.age,
    sex: user.sex as "male" | "female",
    activityLevel: user.activityLevel as ActivityLevel,
    goalType: user.goalType as "lose_fat" | "maintain" | "build_muscle",
    goalBodyFatPercent: user.goalBodyFatPercent,
  });
}

export function macrosFromUser(user: UserLike) {
  if (
    user.macroOverrideCalories &&
    user.macroOverrideProteinG &&
    user.macroOverrideCarbsG &&
    user.macroOverrideFatG
  ) {
    return {
      calories: user.macroOverrideCalories,
      proteinG: user.macroOverrideProteinG,
      carbsG: user.macroOverrideCarbsG,
      fatG: user.macroOverrideFatG,
    };
  }
  const physique = physiqueFromUser(user);
  return physique ? calculateMacros(physique.targetCalories, physique.leanBodyMassLbs) : null;
}

export async function syncWeightFromCheckIn(userId: string, weightLbs: number) {
  await User.findByIdAndUpdate(userId, { weightLbs });
}
