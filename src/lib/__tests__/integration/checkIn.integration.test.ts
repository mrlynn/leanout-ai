/**
 * Integration tests for the check-in and XP award pipeline.
 * Tests awardCheckIn (the core gamification function) against real Mongoose models
 * in an in-memory MongoDB instance.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { setupDB, teardownDB, clearDB, createTestUser } from "./setup";

beforeAll(setupDB);
afterAll(teardownDB);
beforeEach(clearDB);

async function getUserModel() {
  return (await import("@/models/User")).default;
}

async function getCheckInModel() {
  return (await import("@/models/DailyCheckIn")).default;
}

const baseCheckIn = {
  compliance: 8,
  workoutCompleted: false,
  steps: undefined as number | undefined,
  weightLbs: 180,
};

describe("awardCheckIn", () => {
  it("awards base XP on first check-in", async () => {
    const { awardCheckIn } = await import("@/lib/awardXP");
    const User = await getUserModel();
    const userId = await createTestUser();

    const result = await awardCheckIn(userId, baseCheckIn);
    expect(result.xpGained).toBeGreaterThan(0);

    const user = await User.findById(userId).lean();
    expect(user!.xp).toBe(result.xpGained);
  });

  it("sets streak to 1 on first check-in", async () => {
    const { awardCheckIn } = await import("@/lib/awardXP");
    const userId = await createTestUser();

    const result = await awardCheckIn(userId, baseCheckIn);
    expect(result.newStreak).toBe(1);
  });

  it("awards first_checkin badge on first check-in", async () => {
    const { awardCheckIn } = await import("@/lib/awardXP");
    const DailyCheckIn = await getCheckInModel();
    const userId = await createTestUser();

    // Simulate what the route handler does: create the DailyCheckIn record
    // *before* calling awardCheckIn, which queries countDocuments to detect "first".
    const today = new Date(); today.setHours(0, 0, 0, 0);
    await DailyCheckIn.create({ userId, date: today, weightLbs: 180, hunger: 5, energy: 7, compliance: 8 });

    const result = await awardCheckIn(userId, baseCheckIn);
    expect(result.newBadges).toContain("first_checkin");
  });

  it("does not re-award first_checkin badge on second check-in", async () => {
    const { awardCheckIn } = await import("@/lib/awardXP");
    const User = await getUserModel();
    const userId = await createTestUser();

    // First check-in
    await awardCheckIn(userId, baseCheckIn);

    // Simulate yesterday's lastCheckInDate so streak logic sees consecutive days
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    await User.findByIdAndUpdate(userId, { lastCheckInDate: yesterday });

    const result = await awardCheckIn(userId, baseCheckIn);
    expect(result.newBadges).not.toContain("first_checkin");
  });

  it("increments streak on consecutive daily check-ins", async () => {
    const { awardCheckIn } = await import("@/lib/awardXP");
    const User = await getUserModel();
    const userId = await createTestUser();

    // First check-in
    await awardCheckIn(userId, baseCheckIn);

    // Move lastCheckInDate to yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    await User.findByIdAndUpdate(userId, { lastCheckInDate: yesterday, currentStreak: 1 });

    const result = await awardCheckIn(userId, baseCheckIn);
    expect(result.newStreak).toBe(2);
  });

  it("resets streak when a day is missed (no freeze)", async () => {
    const { awardCheckIn } = await import("@/lib/awardXP");
    const User = await getUserModel();
    const userId = await createTestUser({ streakFreezes: 0 });

    // Simulate a 5-day streak from 3 days ago (streak is broken)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    threeDaysAgo.setHours(0, 0, 0, 0);
    await User.findByIdAndUpdate(userId, { lastCheckInDate: threeDaysAgo, currentStreak: 5 });

    const result = await awardCheckIn(userId, baseCheckIn);
    expect(result.newStreak).toBe(1);
  });

  it("uses streak freeze when exactly one day is missed", async () => {
    const { awardCheckIn } = await import("@/lib/awardXP");
    const User = await getUserModel();
    const userId = await createTestUser({ streakFreezes: 1 });

    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    twoDaysAgo.setHours(0, 0, 0, 0);
    await User.findByIdAndUpdate(userId, { lastCheckInDate: twoDaysAgo, currentStreak: 4 });

    const result = await awardCheckIn(userId, baseCheckIn);
    expect(result.freezeUsed).toBe(true);
    expect(result.newStreak).toBe(5);
  });

  it("awards workout XP when workoutCompleted is true", async () => {
    const { awardCheckIn } = await import("@/lib/awardXP");
    const userId = await createTestUser();

    const withWorkout = await awardCheckIn(userId, { ...baseCheckIn, workoutCompleted: true });
    // Reset user for clean comparison
    const userId2 = await createTestUser();
    const withoutWorkout = await awardCheckIn(userId2, { ...baseCheckIn, workoutCompleted: false });

    expect(withWorkout.xpGained).toBeGreaterThan(withoutWorkout.xpGained);
  });

  it("XP is persisted to the user document", async () => {
    const { awardCheckIn } = await import("@/lib/awardXP");
    const User = await getUserModel();
    const userId = await createTestUser();

    const result = await awardCheckIn(userId, baseCheckIn);
    const user = await User.findById(userId).lean();
    expect(user!.xp).toBe(result.xpGained);
    expect(user!.xpSpendable).toBe(result.xpGained);
  });

  it("leveledUp is true when XP crosses a level threshold", async () => {
    const { awardCheckIn } = await import("@/lib/awardXP");
    const { xpForLevel } = await import("@/lib/gamification");

    // Level 2 threshold = 100 XP. Start at 90 so any check-in (min 10 XP base) crosses it.
    const userId = await createTestUser({ xp: 90, xpSpendable: 90 });

    const result = await awardCheckIn(userId, { compliance: 8, workoutCompleted: false, weightLbs: 180 });

    // 90 + 15 (base 10 + compliance≥8 5) = 105 >= 100 → level 2
    expect(result.xpGained).toBeGreaterThanOrEqual(15);
    expect(result.leveledUp).toBe(true);
    expect(result.newLevel).toBe(2);
  });
});

describe("DailyCheckIn model", () => {
  it("enforces unique (userId, date) constraint", async () => {
    const DailyCheckIn = await getCheckInModel();
    const userId = await createTestUser();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await DailyCheckIn.create({ userId, date: today, weightLbs: 180, hunger: 5, energy: 7, compliance: 8 });

    await expect(
      DailyCheckIn.create({ userId, date: today, weightLbs: 181, hunger: 6, energy: 6, compliance: 7 })
    ).rejects.toThrow();
  });

  it("validates compliance is in range 1–10", async () => {
    const DailyCheckIn = await getCheckInModel();
    const userId = await createTestUser();
    const today = new Date(); today.setHours(0, 0, 0, 0);

    await expect(
      DailyCheckIn.create({ userId, date: today, weightLbs: 180, hunger: 5, energy: 5, compliance: 11 })
    ).rejects.toThrow();

    await expect(
      DailyCheckIn.create({ userId, date: today, weightLbs: 180, hunger: 5, energy: 5, compliance: 0 })
    ).rejects.toThrow();
  });

  it("PATCH (findOneAndUpdate scoped by userId) cannot update another user's check-in", async () => {
    const DailyCheckIn = await getCheckInModel();
    const userA = await createTestUser();
    const userB = await createTestUser();
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const checkIn = await DailyCheckIn.create({ userId: userA, date: today, weightLbs: 180, hunger: 5, energy: 7, compliance: 8 });

    const result = await DailyCheckIn.findOneAndUpdate(
      { _id: checkIn._id, userId: userB },
      { $set: { compliance: 1 } },
      { returnDocument: "after" }
    );
    expect(result).toBeNull();

    // Original still unchanged
    const original = await DailyCheckIn.findById(checkIn._id).lean();
    expect(original!.compliance).toBe(8);
  });
});
