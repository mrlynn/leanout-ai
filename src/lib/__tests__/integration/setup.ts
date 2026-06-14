/**
 * Shared test infrastructure for integration tests.
 *
 * - Starts an in-memory MongoDB before all tests
 * - Connects Mongoose to it (bypassing the real MONGODB_URI)
 * - Clears all collections between tests
 * - Tears down after all tests
 */
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongod: MongoMemoryServer;

export async function setupDB() {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
}

export async function teardownDB() {
  await mongoose.disconnect();
  await mongod.stop();
}

export async function clearDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

/** Create a minimal user document and return its _id as a string */
export async function createTestUser(overrides: Record<string, unknown> = {}): Promise<string> {
  const User = (await import("@/models/User")).default;
  const user = await User.create({
    name: "Test User",
    email: `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    xp: 0,
    xpSpendable: 0,
    currentStreak: 0,
    longestStreak: 0,
    earnedBadges: [],
    planTier: "free",
    ...overrides,
  });
  return String(user._id);
}
