import { describe, it, expect } from "vitest";
import { xpForLevel, levelFromXP, xpProgress, checkInXP, BADGES, BADGE_MAP } from "@/lib/gamification";

describe("xpForLevel", () => {
  it("level 1 requires 0 XP", () => {
    expect(xpForLevel(1)).toBe(0);
  });

  it("level 2 requires 100 XP", () => {
    // l=2: 50 + 1*50 = 100
    expect(xpForLevel(2)).toBe(100);
  });

  it("level 3 requires 250 XP", () => {
    // l=2: 100, l=3: 100 + 150 = 250
    expect(xpForLevel(3)).toBe(250);
  });

  it("level 4 requires 450 XP", () => {
    expect(xpForLevel(4)).toBe(450);
  });

  it("thresholds are strictly increasing", () => {
    for (let l = 1; l < 20; l++) {
      expect(xpForLevel(l + 1)).toBeGreaterThan(xpForLevel(l));
    }
  });
});

describe("levelFromXP", () => {
  it("0 XP → level 1", () => {
    expect(levelFromXP(0)).toBe(1);
  });

  it("99 XP → level 1", () => {
    expect(levelFromXP(99)).toBe(1);
  });

  it("100 XP → level 2", () => {
    expect(levelFromXP(100)).toBe(2);
  });

  it("249 XP → level 2", () => {
    expect(levelFromXP(249)).toBe(2);
  });

  it("250 XP → level 3", () => {
    expect(levelFromXP(250)).toBe(3);
  });

  it("449 XP → level 3", () => {
    expect(levelFromXP(449)).toBe(3);
  });

  it("450 XP → level 4", () => {
    expect(levelFromXP(450)).toBe(4);
  });

  it("xpForLevel boundary: level N starts at exactly xpForLevel(N)", () => {
    for (let l = 1; l <= 10; l++) {
      expect(levelFromXP(xpForLevel(l))).toBe(l);
    }
  });

  it("one below xpForLevel(N) stays at level N-1", () => {
    for (let l = 2; l <= 10; l++) {
      expect(levelFromXP(xpForLevel(l) - 1)).toBe(l - 1);
    }
  });
});

describe("xpProgress", () => {
  it("pct is 0 at level floor", () => {
    const { pct } = xpProgress(xpForLevel(3)); // exactly at level 3
    expect(pct).toBe(0);
  });

  it("pct is 100 at level ceiling minus 1", () => {
    const floor = xpForLevel(3);
    const ceiling = xpForLevel(4);
    const { pct } = xpProgress(ceiling - 1);
    expect(pct).toBe(100);
  });

  it("returns correct level", () => {
    expect(xpProgress(250).level).toBe(3);
  });

  it("current + floor = xp", () => {
    const xp = 300;
    const { level, current } = xpProgress(xp);
    expect(xpForLevel(level) + current).toBe(xp);
  });
});

describe("checkInXP", () => {
  it("base check-in always awards 10 XP", () => {
    expect(checkInXP({ compliance: 5, workoutCompleted: false, streakBonus: false })).toBe(10);
  });

  it("compliance ≥ 8 adds 5 XP", () => {
    const base = checkInXP({ compliance: 7, workoutCompleted: false, streakBonus: false });
    const good = checkInXP({ compliance: 8, workoutCompleted: false, streakBonus: false });
    expect(good - base).toBe(5);
  });

  it("compliance = 10 adds an extra 5 XP on top of the ≥8 bonus", () => {
    const atEight = checkInXP({ compliance: 8, workoutCompleted: false, streakBonus: false });
    const perfect = checkInXP({ compliance: 10, workoutCompleted: false, streakBonus: false });
    expect(perfect - atEight).toBe(5);
  });

  it("compliance 7 does not trigger the ≥8 bonus", () => {
    const xp = checkInXP({ compliance: 7, workoutCompleted: false, streakBonus: false });
    expect(xp).toBe(10);
  });

  it("workoutCompleted adds 10 XP", () => {
    const without = checkInXP({ compliance: 5, workoutCompleted: false, streakBonus: false });
    const withWorkout = checkInXP({ compliance: 5, workoutCompleted: true, streakBonus: false });
    expect(withWorkout - without).toBe(10);
  });

  it("steps ≥ 10000 adds 5 XP", () => {
    const without = checkInXP({ compliance: 5, workoutCompleted: false, steps: 9999, streakBonus: false });
    const withSteps = checkInXP({ compliance: 5, workoutCompleted: false, steps: 10000, streakBonus: false });
    expect(withSteps - without).toBe(5);
  });

  it("streakBonus adds 25 XP", () => {
    const without = checkInXP({ compliance: 5, workoutCompleted: false, streakBonus: false });
    const withStreak = checkInXP({ compliance: 5, workoutCompleted: false, streakBonus: true });
    expect(withStreak - without).toBe(25);
  });

  it("perfect check-in (all bonuses) returns correct total", () => {
    // base 10 + compliance≥8 5 + compliance=10 5 + workout 10 + steps 5 + streak 25 = 60
    const xp = checkInXP({ compliance: 10, workoutCompleted: true, steps: 15000, streakBonus: true });
    expect(xp).toBe(60);
  });
});

describe("BADGES", () => {
  it("all badge IDs are unique", () => {
    const ids = BADGES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("BADGE_MAP contains every badge", () => {
    for (const badge of BADGES) {
      expect(BADGE_MAP[badge.id]).toBeDefined();
      expect(BADGE_MAP[badge.id].name).toBe(badge.name);
    }
  });

  it("all xpRewards are non-negative", () => {
    for (const badge of BADGES) {
      expect(badge.xpReward).toBeGreaterThanOrEqual(0);
    }
  });
});
