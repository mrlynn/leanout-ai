import { describe, it, expect } from "vitest";
import { calculatePhysique, calculateMacros } from "@/lib/calculator";

describe("calculatePhysique", () => {
  const base = {
    weightLbs: 200,
    bodyFatPercent: 20,
    heightInches: 70,
    age: 30,
    sex: "male" as const,
    activityLevel: "moderately_active" as const,
    goalType: "lose_fat" as const,
  };

  it("computes lean body mass correctly", () => {
    const r = calculatePhysique(base);
    expect(r.leanBodyMassLbs).toBeCloseTo(160, 0);
    expect(r.fatMassLbs).toBeCloseTo(40, 0);
  });

  it("maintenanceCalories is positive and in a sane range", () => {
    const r = calculatePhysique(base);
    expect(r.maintenanceCalories).toBeGreaterThan(1500);
    expect(r.maintenanceCalories).toBeLessThan(5000);
  });

  it("targetCalories is below maintenance for lose_fat goal", () => {
    const r = calculatePhysique(base);
    expect(r.targetCalories).toBeLessThan(r.maintenanceCalories);
  });

  it("targetCalories is above maintenance for build_muscle goal", () => {
    const r = calculatePhysique({ ...base, goalType: "build_muscle" });
    expect(r.targetCalories).toBe(r.maintenanceCalories + 300);
  });

  it("targetCalories equals maintenance for maintain goal", () => {
    const r = calculatePhysique({ ...base, goalType: "maintain" });
    expect(r.targetCalories).toBe(r.maintenanceCalories);
  });

  it("female BMR is lower than male all else equal", () => {
    const male = calculatePhysique(base);
    const female = calculatePhysique({ ...base, sex: "female" });
    expect(female.maintenanceCalories).toBeLessThan(male.maintenanceCalories);
  });

  it("higher activity multiplier produces higher maintenance calories", () => {
    const sedentary = calculatePhysique({ ...base, activityLevel: "sedentary" });
    const active = calculatePhysique({ ...base, activityLevel: "very_active" });
    expect(active.maintenanceCalories).toBeGreaterThan(sedentary.maintenanceCalories);
  });

  it("weeksToGoal is 0 when not losing fat", () => {
    const r = calculatePhysique({ ...base, goalType: "maintain" });
    expect(r.weeksToGoal).toBe(0);
  });

  it("weeksToGoal is positive for lose_fat with fat to lose", () => {
    const r = calculatePhysique({ ...base, goalBodyFatPercent: 12 });
    expect(r.weeksToGoal).toBeGreaterThan(0);
  });

  it("respects custom goalBodyFatPercent", () => {
    const r = calculatePhysique({ ...base, goalBodyFatPercent: 15 });
    // At 15% bf, goal weight = LBM / 0.85
    const lbm = 200 * 0.8;
    const expected = Math.round((lbm / 0.85) * 10) / 10;
    expect(r.goalWeightLbs).toBe(expected);
  });
});

describe("calculateMacros", () => {
  it("protein grams = 1.3 × LBM", () => {
    const r = calculateMacros(2000, 160);
    expect(r.proteinG).toBe(Math.round(160 * 1.3));
  });

  it("fat is approximately 25% of calories", () => {
    const r = calculateMacros(2000, 160);
    const expectedFat = Math.round(Math.round(2000 * 0.25) / 9);
    expect(r.fatG).toBe(expectedFat);
  });

  it("carbs are non-negative", () => {
    // Even with very high protein target (high LBM, low calories), carbs should not go negative
    const r = calculateMacros(1200, 200);
    expect(r.carbsG).toBeGreaterThanOrEqual(0);
  });

  it("calories passthrough equals targetCalories", () => {
    const r = calculateMacros(2400, 160);
    expect(r.calories).toBe(2400);
  });

  it("macro calorie sum is approximately equal to target (within rounding)", () => {
    const r = calculateMacros(2000, 150);
    const macroKcal = r.proteinG * 4 + r.carbsG * 4 + r.fatG * 9;
    // Allow ±30 kcal rounding slack
    expect(Math.abs(macroKcal - 2000)).toBeLessThan(30);
  });
});
