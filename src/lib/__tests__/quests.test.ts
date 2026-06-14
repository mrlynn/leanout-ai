import { describe, it, expect } from "vitest";
import { currentWeekStart, QUEST_DEFS, QUEST_MAP } from "@/lib/quests";

describe("currentWeekStart", () => {
  it("returns a Monday for any day of the week", () => {
    // Use local-time constructor (year, month-1, day) to avoid UTC-to-local shift
    // Jan 7 2024 is a Sunday; iterate back through the week
    for (let offset = 0; offset < 7; offset++) {
      const d = new Date(2024, 0, 7 - offset, 12, 0, 0); // noon local to stay on the right day
      const result = currentWeekStart(d);
      // Parse result as local midnight to check the weekday
      const [y, mo, day] = result.split("-").map(Number);
      const parsed = new Date(y, mo - 1, day);
      expect(parsed.getDay()).toBe(1); // 1 = Monday
    }
  });

  it("Monday returns itself as week start", () => {
    const monday = new Date(2024, 0, 8, 12, 0, 0); // Jan 8 2024 = Monday, noon local
    expect(currentWeekStart(monday)).toBe("2024-01-08");
  });

  it("Sunday returns the previous Monday", () => {
    const sunday = new Date(2024, 0, 7, 12, 0, 0); // Jan 7 2024 = Sunday, noon local
    expect(currentWeekStart(sunday)).toBe("2024-01-01");
  });

  it("returns YYYY-MM-DD format", () => {
    const result = currentWeekStart(new Date(2024, 5, 15, 12, 0, 0));
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("two dates in the same week return the same start", () => {
    const tue = currentWeekStart(new Date(2024, 0, 9, 12, 0, 0)); // Tue
    const fri = currentWeekStart(new Date(2024, 0, 12, 12, 0, 0)); // Fri
    expect(tue).toBe(fri);
  });

  it("Monday and the Sunday before return different weeks", () => {
    const monday = currentWeekStart(new Date(2024, 0, 8, 12, 0, 0)); // Jan 8 Mon
    const sundayBefore = currentWeekStart(new Date(2024, 0, 7, 12, 0, 0)); // Jan 7 Sun
    expect(monday).not.toBe(sundayBefore);
  });
});

describe("QUEST_DEFS", () => {
  it("all quest IDs are unique", () => {
    const ids = QUEST_DEFS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("QUEST_MAP contains every quest def", () => {
    for (const q of QUEST_DEFS) {
      expect(QUEST_MAP[q.id]).toBeDefined();
      expect(QUEST_MAP[q.id].name).toBe(q.name);
    }
  });

  it("all xpRewards are positive", () => {
    for (const q of QUEST_DEFS) {
      expect(q.xpReward).toBeGreaterThan(0);
    }
  });

  it("description is a function that returns a string", () => {
    for (const q of QUEST_DEFS) {
      const desc = q.description({ days: 4, stepTarget: 8000 });
      expect(typeof desc).toBe("string");
      expect(desc.length).toBeGreaterThan(0);
    }
  });

  it("categories are valid values", () => {
    const validCategories = new Set(["nutrition", "activity", "engagement"]);
    for (const q of QUEST_DEFS) {
      expect(validCategories.has(q.category)).toBe(true);
    }
  });
});
