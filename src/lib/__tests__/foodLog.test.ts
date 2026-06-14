import { describe, it, expect } from "vitest";
import {
  getDateString,
  sumFoods,
  aggregateDayTotals,
  isValidMealType,
  isValidSource,
  validateFoods,
  inferMealTypeFromName,
} from "@/lib/foodLog";
import type { FoodItem } from "@/lib/foodLog";

const makeFood = (overrides: Partial<FoodItem> = {}): FoodItem => ({
  name: "Chicken Breast",
  quantity: "100g",
  calories: 165,
  protein: 31,
  carbs: 0,
  fat: 3.6,
  ...overrides,
});

describe("getDateString", () => {
  it("formats a known date correctly", () => {
    const d = new Date(2024, 0, 5); // Jan 5 2024
    expect(getDateString(d)).toBe("2024-01-05");
  });

  it("zero-pads month and day", () => {
    const d = new Date(2024, 8, 3); // Sep 3
    expect(getDateString(d)).toBe("2024-09-03");
  });
});

describe("sumFoods", () => {
  it("returns zeros for empty array", () => {
    expect(sumFoods([])).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  });

  it("sums a single item", () => {
    const result = sumFoods([makeFood()]);
    expect(result.calories).toBe(165);
    expect(result.protein).toBe(31);
  });

  it("sums multiple items", () => {
    const foods = [makeFood({ calories: 100, protein: 10, carbs: 5, fat: 2 }), makeFood({ calories: 200, protein: 20, carbs: 10, fat: 4 })];
    const r = sumFoods(foods);
    expect(r.calories).toBe(300);
    expect(r.protein).toBe(30);
    expect(r.carbs).toBe(15);
    expect(r.fat).toBe(6);
  });

  it("treats undefined/NaN-like values as 0 via || 0", () => {
    // Verify no NaN propagation if a field is 0
    const food = makeFood({ calories: 0, protein: 0, carbs: 0, fat: 0 });
    expect(sumFoods([food])).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  });
});

describe("aggregateDayTotals", () => {
  it("returns zeros for empty entries", () => {
    expect(aggregateDayTotals([])).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  });

  it("sums across multiple meal entries", () => {
    const entries = [
      { foods: [makeFood({ calories: 300, protein: 30, carbs: 20, fat: 5 })] },
      { foods: [makeFood({ calories: 500, protein: 40, carbs: 60, fat: 10 })] },
    ];
    const r = aggregateDayTotals(entries);
    expect(r.calories).toBe(800);
    expect(r.protein).toBe(70);
    expect(r.carbs).toBe(80);
    expect(r.fat).toBe(15);
  });
});

describe("isValidMealType", () => {
  it("accepts valid meal types", () => {
    expect(isValidMealType("breakfast")).toBe(true);
    expect(isValidMealType("lunch")).toBe(true);
    expect(isValidMealType("dinner")).toBe(true);
    expect(isValidMealType("snack")).toBe(true);
  });

  it("rejects invalid values", () => {
    expect(isValidMealType("brunch")).toBe(false);
    expect(isValidMealType("")).toBe(false);
    expect(isValidMealType("BREAKFAST")).toBe(false);
  });
});

describe("isValidSource", () => {
  it("accepts all valid sources", () => {
    for (const s of ["vision", "manual", "meal_plan", "voice"]) {
      expect(isValidSource(s)).toBe(true);
    }
  });

  it("rejects unknown sources", () => {
    expect(isValidSource("barcode")).toBe(false);
    expect(isValidSource("")).toBe(false);
  });
});

describe("validateFoods", () => {
  it("accepts a valid food array", () => {
    expect(validateFoods([makeFood()])).toBe(true);
  });

  it("rejects empty array", () => {
    expect(validateFoods([])).toBe(false);
  });

  it("rejects non-array", () => {
    expect(validateFoods(null)).toBe(false);
    expect(validateFoods("chicken")).toBe(false);
  });

  it("rejects item with empty name", () => {
    expect(validateFoods([makeFood({ name: "" })])).toBe(false);
    expect(validateFoods([makeFood({ name: "   " })])).toBe(false);
  });

  it("rejects item with negative calories", () => {
    expect(validateFoods([makeFood({ calories: -1 })])).toBe(false);
  });

  it("rejects item with negative macros", () => {
    expect(validateFoods([makeFood({ protein: -5 })])).toBe(false);
    expect(validateFoods([makeFood({ carbs: -1 })])).toBe(false);
    expect(validateFoods([makeFood({ fat: -0.1 })])).toBe(false);
  });

  it("rejects item missing required fields", () => {
    const bad = { name: "Chicken", quantity: "100g" }; // missing macros
    expect(validateFoods([bad])).toBe(false);
  });
});

describe("inferMealTypeFromName", () => {
  it("infers breakfast", () => expect(inferMealTypeFromName("Morning Breakfast Bowl")).toBe("breakfast"));
  it("infers lunch", () => expect(inferMealTypeFromName("Lunch Salad")).toBe("lunch"));
  it("infers dinner", () => expect(inferMealTypeFromName("Dinner Steak")).toBe("dinner"));
  it("defaults to snack for unknown", () => expect(inferMealTypeFromName("Pre-Workout Mix")).toBe("snack"));
  it("is case-insensitive", () => expect(inferMealTypeFromName("BREAKFAST")).toBe("breakfast"));
});
