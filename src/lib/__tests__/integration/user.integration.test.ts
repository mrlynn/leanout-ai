/**
 * Integration tests for the User model — specifically verifying
 * that the password field is excluded from API responses and
 * that required fields are enforced at the DB layer.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { setupDB, teardownDB, clearDB, createTestUser } from "./setup";

beforeAll(setupDB);
afterAll(teardownDB);
beforeEach(clearDB);

async function getUserModel() {
  return (await import("@/models/User")).default;
}

describe("User model", () => {
  it("stores a user and retrieves without password when projected", async () => {
    const User = await getUserModel();
    const user = await User.create({
      name: "Alice",
      email: "alice@test.com",
      password: "hashedpassword123",
      xp: 0,
      xpSpendable: 0,
      earnedBadges: [],
    });

    const fetched = await User.findById(user._id).select("-password").lean();
    expect(fetched).not.toBeNull();
    expect((fetched as Record<string, unknown>).password).toBeUndefined();
    expect(fetched!.name).toBe("Alice");
  });

  it("requires name and email", async () => {
    const User = await getUserModel();
    await expect(User.create({ email: "no-name@test.com" })).rejects.toThrow();
    await expect(User.create({ name: "No Email" })).rejects.toThrow();
  });

  it("enforces unique email constraint", async () => {
    const User = await getUserModel();
    await User.create({ name: "Bob", email: "dup@test.com" });
    await expect(User.create({ name: "Bob2", email: "dup@test.com" })).rejects.toThrow();
  });

  it("earnedBadges defaults to empty array", async () => {
    const User = await getUserModel();
    const user = await User.create({ name: "Carol", email: "carol@test.com" });
    expect(user.earnedBadges).toEqual([]);
  });

  it("xp defaults to 0", async () => {
    const User = await getUserModel();
    const user = await User.create({ name: "Dan", email: "dan@test.com" });
    expect(user.xp).toBe(0);
  });

  it("planTier defaults to free", async () => {
    const User = await getUserModel();
    const user = await User.create({ name: "Eve", email: "eve@test.com" });
    expect(user.planTier).toBe("free");
  });

  it("startingWeightLbs is set once and not overwritten by $inc on XP", async () => {
    const User = await getUserModel();
    const userId = await createTestUser({ startingWeightLbs: 200 });

    // XP update via $inc should not touch startingWeightLbs
    await User.findByIdAndUpdate(userId, { $inc: { xp: 50, xpSpendable: 50 } });

    const user = await User.findById(userId).lean();
    expect(user!.startingWeightLbs).toBe(200);
    expect(user!.xp).toBe(50);
  });

  it("streakFreezes is bounded 0–2 by schema", async () => {
    const User = await getUserModel();
    await expect(
      User.create({ name: "F", email: "f@test.com", streakFreezes: 3 })
    ).rejects.toThrow();
  });
});

describe("validation — pickCheckInFields", () => {
  it("rejects unknown fields", async () => {
    const { pickCheckInFields } = await import("@/lib/validation");
    const result = pickCheckInFields({ compliance: 8, hunger: 5, energy: 7, weightLbs: 180, unknownField: "x" });
    expect("error" in result).toBe(true);
  });

  it("rejects compliance out of range", async () => {
    const { pickCheckInFields } = await import("@/lib/validation");
    expect("error" in pickCheckInFields({ compliance: 11, hunger: 5, energy: 7, weightLbs: 180 })).toBe(true);
    expect("error" in pickCheckInFields({ compliance: 0, hunger: 5, energy: 7, weightLbs: 180 })).toBe(true);
  });

  it("rejects negative weightLbs", async () => {
    const { pickCheckInFields } = await import("@/lib/validation");
    const result = pickCheckInFields({ compliance: 8, hunger: 5, energy: 7, weightLbs: -10 });
    expect("error" in result).toBe(true);
  });

  it("rejects negative steps", async () => {
    const { pickCheckInFields } = await import("@/lib/validation");
    const result = pickCheckInFields({ compliance: 8, hunger: 5, energy: 7, weightLbs: 180, steps: -1 });
    expect("error" in result).toBe(true);
  });

  it("accepts a fully valid payload", async () => {
    const { pickCheckInFields } = await import("@/lib/validation");
    const result = pickCheckInFields({ compliance: 8, hunger: 5, energy: 7, weightLbs: 180, steps: 8000, workoutCompleted: true });
    expect("fields" in result).toBe(true);
  });
});
