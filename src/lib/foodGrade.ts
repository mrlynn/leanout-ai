import type { FoodItem, MacroTotals } from "@/lib/foodLog";

export type Grade = "A" | "B" | "C" | "D" | "F";

export interface FoodGrade {
  grade: Grade;
  score: number;
  rationale: string;
}

export interface UserGoalsForGrade {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  goalType?: "lose_fat" | "maintain" | "build_muscle";
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function scoreToGrade(score: number): Grade {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

/**
 * Grade a food item against the user's goals and their remaining macro budget for the day.
 * Score is 0–100; grades: A≥85, B≥70, C≥55, D≥40, F<40.
 */
export function gradeFoodItem(
  food: FoodItem,
  goals: UserGoalsForGrade,
  dayTotals: MacroTotals
): FoodGrade {
  if (food.calories <= 0) {
    return { grade: "C", score: 55, rationale: "No calorie data available to grade this item." };
  }

  const reasons: string[] = [];
  let score = 0;

  // — Protein density (30 pts) —
  // Ideal: ≥ 10g protein per 100 kcal (lean protein sources)
  const proteinPer100kcal = (food.protein / food.calories) * 100;
  const proteinScore = clamp(proteinPer100kcal / 10, 0, 1) * 30;
  score += proteinScore;
  if (proteinPer100kcal >= 8) {
    reasons.push("good protein density");
  } else if (proteinPer100kcal < 3) {
    reasons.push("low protein");
  }

  // — Calorie quality / macro balance (20 pts) —
  // Penalise foods that are mostly carbs with very little protein or fat (likely refined/sugar)
  const totalMacroG = food.protein + food.carbs + food.fat;
  let qualityScore = 20;
  if (totalMacroG > 0) {
    const carbRatio = food.carbs / totalMacroG;
    // Penalise if >70% of macro grams are carbs and protein density is low
    if (carbRatio > 0.7 && proteinPer100kcal < 5) {
      qualityScore = Math.max(0, 20 - (carbRatio - 0.7) * 100);
      reasons.push("high refined-carb ratio");
    }
  }
  score += qualityScore;

  // — Fat quality (15 pts) —
  // Reward balanced fat; mildly penalise if calories are almost entirely from fat with no protein
  const fatCaloriePct = (food.fat * 9) / food.calories;
  let fatScore = 15;
  if (fatCaloriePct > 0.7 && food.protein < 5) {
    fatScore = Math.max(0, 15 - (fatCaloriePct - 0.7) * 50);
    reasons.push("very high fat, low protein");
  }
  score += fatScore;

  // — Goal alignment (35 pts) —
  // How well does this food fit within the user's remaining macro budget for the day?
  const remainingCalories = Math.max(0, goals.calories - dayTotals.calories);
  const remainingProtein = Math.max(0, goals.proteinG - dayTotals.protein);

  let alignmentScore = 35;
  const calorieBudgetPct = remainingCalories > 0 ? food.calories / remainingCalories : 2;

  if (calorieBudgetPct > 1.5) {
    // Food alone exceeds 150% of remaining calorie budget
    alignmentScore = Math.max(0, 35 - (calorieBudgetPct - 1.5) * 25);
    reasons.push("exceeds remaining calorie budget");
  } else if (goals.goalType === "lose_fat" && calorieBudgetPct > 1.0) {
    // Lose-fat goal: stricter — penalise if food exceeds remaining budget
    alignmentScore = Math.max(5, 35 - (calorieBudgetPct - 1.0) * 30);
    reasons.push("pushes over daily calorie target");
  }

  // Bonus: if protein-hungry and this food delivers protein
  if (remainingProtein > 20 && food.protein > 15) {
    alignmentScore = Math.min(35, alignmentScore + 5);
    reasons.push("helps hit protein goal");
  }

  score += alignmentScore;

  const finalScore = Math.round(clamp(score, 0, 100));
  const grade = scoreToGrade(finalScore);

  const positiveReasons = reasons.filter((r) =>
    r.includes("good") || r.includes("helps")
  );
  const negativeReasons = reasons.filter((r) =>
    !r.includes("good") && !r.includes("helps")
  );

  let rationale = "";
  if (negativeReasons.length > 0) {
    rationale = negativeReasons[0].charAt(0).toUpperCase() + negativeReasons[0].slice(1);
    if (positiveReasons.length > 0) rationale += `; ${positiveReasons[0]}`;
  } else if (positiveReasons.length > 0) {
    rationale = positiveReasons[0].charAt(0).toUpperCase() + positiveReasons[0].slice(1);
  } else {
    const descriptors: Record<Grade, string> = {
      A: "Excellent fit for your goals",
      B: "Good choice for your goals",
      C: "Reasonable option",
      D: "Marginal fit for your goals",
      F: "Poor fit for your goals",
    };
    rationale = descriptors[grade];
  }

  return { grade, score: finalScore, rationale };
}
