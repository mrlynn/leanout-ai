import { describe, it, expect } from "vitest";
import { estimateExpenditure } from "@/lib/macroAdherence";

// Note: getMacroAdherence requires MongoDB (tested in integration layer).
// estimateExpenditure is pure and fully testable here.

describe("estimateExpenditure", () => {
  it("returns null for zero days", () => {
    expect(estimateExpenditure(2000, -1, 0)).toBeNull();
  });

  it("returns null for zero avgIntake", () => {
    expect(estimateExpenditure(0, 0, 7)).toBeNull();
  });

  it("returns null for negative days", () => {
    expect(estimateExpenditure(2000, 0, -1)).toBeNull();
  });

  it("returns intake when weight is unchanged", () => {
    // No weight change → TDEE ≈ intake
    expect(estimateExpenditure(2000, 0, 7)).toBe(2000);
  });

  it("returns higher TDEE when user lost weight (deficit)", () => {
    // Lost 1 lb over 7 days → TDEE = 2000 - (-1 * 3500/7) = 2000 + 500 = 2500
    const result = estimateExpenditure(2000, -1, 7);
    expect(result).toBe(2500);
  });

  it("returns lower TDEE when user gained weight (surplus)", () => {
    // Gained 1 lb over 7 days → TDEE = 2000 - (1 * 3500/7) = 2000 - 500 = 1500
    const result = estimateExpenditure(2000, 1, 7);
    expect(result).toBe(1500);
  });

  it("is rounded to integer kcal", () => {
    const result = estimateExpenditure(2100, -0.5, 7);
    expect(Number.isInteger(result)).toBe(true);
  });
});
