/**
 * Integration tests for food-log business logic against a real in-memory MongoDB.
 * Tests the model layer directly (not the HTTP layer) to stay fast and avoid
 * Next.js route handler complexity. HTTP-layer tests go in the E2E layer.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { setupDB, teardownDB, clearDB, createTestUser } from "./setup";
import mongoose from "mongoose";

beforeAll(setupDB);
afterAll(teardownDB);
beforeEach(clearDB);

async function getFoodLogEntry() {
  return (await import("@/models/FoodLogEntry")).default;
}

const sampleFood = {
  name: "Chicken Breast",
  quantity: "150g",
  calories: 248,
  protein: 46,
  carbs: 0,
  fat: 5,
};

describe("FoodLogEntry model", () => {
  it("creates an entry and retrieves it by userId + date", async () => {
    const userId = await createTestUser();
    const FoodLogEntry = await getFoodLogEntry();

    await FoodLogEntry.create({
      userId,
      date: "2024-06-10",
      mealType: "lunch",
      source: "manual",
      foods: [sampleFood],
    });

    const entries = await FoodLogEntry.find({ userId, date: "2024-06-10" }).lean();
    expect(entries).toHaveLength(1);
    expect(entries[0].mealType).toBe("lunch");
    expect(entries[0].foods[0].calories).toBe(248);
  });

  it("entries from user A are not visible to user B", async () => {
    const FoodLogEntry = await getFoodLogEntry();
    const userA = await createTestUser();
    const userB = await createTestUser();

    await FoodLogEntry.create({ userId: userA, date: "2024-06-10", mealType: "breakfast", source: "manual", foods: [sampleFood] });

    const entriesForB = await FoodLogEntry.find({ userId: userB, date: "2024-06-10" }).lean();
    expect(entriesForB).toHaveLength(0);
  });

  it("rejects an entry with empty foods array", async () => {
    const userId = await createTestUser();
    const FoodLogEntry = await getFoodLogEntry();

    await expect(
      FoodLogEntry.create({ userId, date: "2024-06-10", mealType: "breakfast", source: "manual", foods: [] })
    ).rejects.toThrow();
  });

  it("rejects an entry with an invalid mealType", async () => {
    const userId = await createTestUser();
    const FoodLogEntry = await getFoodLogEntry();

    await expect(
      FoodLogEntry.create({ userId, date: "2024-06-10", mealType: "brunch", source: "manual", foods: [sampleFood] })
    ).rejects.toThrow();
  });

  it("rejects an entry with a negative calorie value", async () => {
    const userId = await createTestUser();
    const FoodLogEntry = await getFoodLogEntry();

    await expect(
      FoodLogEntry.create({
        userId, date: "2024-06-10", mealType: "snack", source: "manual",
        foods: [{ ...sampleFood, calories: -10 }],
      })
    ).rejects.toThrow();
  });

  it("aggregateDayTotals correctly sums multiple entries for a user", async () => {
    const { aggregateDayTotals } = await import("@/lib/foodLog");
    const FoodLogEntry = await getFoodLogEntry();
    const userId = await createTestUser();

    await FoodLogEntry.create({ userId, date: "2024-06-10", mealType: "breakfast", source: "manual", foods: [{ name: "Oats", quantity: "100g", calories: 380, protein: 13, carbs: 68, fat: 7 }] });
    await FoodLogEntry.create({ userId, date: "2024-06-10", mealType: "lunch", source: "manual", foods: [sampleFood] });

    const entries = await FoodLogEntry.find({ userId, date: "2024-06-10" }).lean();
    const totals = aggregateDayTotals(entries);

    expect(totals.calories).toBe(380 + 248);
    expect(totals.protein).toBe(13 + 46);
  });

  it("daily totals are 0 when there are no entries", async () => {
    const { aggregateDayTotals } = await import("@/lib/foodLog");
    const userId = await createTestUser();
    const FoodLogEntry = await getFoodLogEntry();

    const entries = await FoodLogEntry.find({ userId, date: "2024-06-10" }).lean();
    const totals = aggregateDayTotals(entries);

    expect(totals.calories).toBe(0);
    expect(totals.protein).toBe(0);
  });

  it("entries from different dates are isolated correctly", async () => {
    const FoodLogEntry = await getFoodLogEntry();
    const userId = await createTestUser();

    await FoodLogEntry.create({ userId, date: "2024-06-10", mealType: "breakfast", source: "manual", foods: [sampleFood] });
    await FoodLogEntry.create({ userId, date: "2024-06-11", mealType: "lunch", source: "manual", foods: [{ ...sampleFood, calories: 400 }] });

    const jun10 = await FoodLogEntry.find({ userId, date: "2024-06-10" }).lean();
    const jun11 = await FoodLogEntry.find({ userId, date: "2024-06-11" }).lean();

    expect(jun10).toHaveLength(1);
    expect(jun11).toHaveLength(1);
    expect(jun10[0].foods[0].calories).toBe(248);
    expect(jun11[0].foods[0].calories).toBe(400);
  });

  it("findOneAndDelete removes entry and returns it", async () => {
    const FoodLogEntry = await getFoodLogEntry();
    const userId = await createTestUser();

    const entry = await FoodLogEntry.create({ userId, date: "2024-06-10", mealType: "snack", source: "manual", foods: [sampleFood] });
    const deleted = await FoodLogEntry.findOneAndDelete({ _id: entry._id, userId });

    expect(deleted).not.toBeNull();
    const remaining = await FoodLogEntry.find({ userId, date: "2024-06-10" }).lean();
    expect(remaining).toHaveLength(0);
  });

  it("findOneAndDelete on another user's entry returns null (isolation)", async () => {
    const FoodLogEntry = await getFoodLogEntry();
    const userA = await createTestUser();
    const userB = await createTestUser();

    const entry = await FoodLogEntry.create({ userId: userA, date: "2024-06-10", mealType: "snack", source: "manual", foods: [sampleFood] });
    const result = await FoodLogEntry.findOneAndDelete({ _id: entry._id, userId: userB });

    expect(result).toBeNull();
    // Entry still exists for user A
    const stillThere = await FoodLogEntry.findById(entry._id).lean();
    expect(stillThere).not.toBeNull();
  });
});
