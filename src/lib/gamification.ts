export interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  xpReward: number;
}

export const BADGES: Badge[] = [
  // Check-in streaks
  { id: "first_checkin",   emoji: "🎯", name: "First Step",        description: "Completed your first check-in",          xpReward: 20  },
  { id: "streak_3",        emoji: "🔥", name: "On a Roll",         description: "3-day check-in streak",                  xpReward: 15  },
  { id: "streak_7",        emoji: "⚡", name: "Week Warrior",      description: "7-day check-in streak",                  xpReward: 50  },
  { id: "streak_14",       emoji: "💥", name: "Two-Week Titan",    description: "14-day check-in streak",                 xpReward: 100 },
  { id: "streak_30",       emoji: "🏆", name: "Iron Commitment",   description: "30-day check-in streak",                 xpReward: 250 },
  // Compliance
  { id: "compliance_10",   emoji: "✨", name: "Perfect Day",       description: "Logged a perfect 10/10 compliance",      xpReward: 25  },
  { id: "compliance_week", emoji: "🥗", name: "Clean Week",        description: "7 consecutive days with compliance ≥ 8", xpReward: 75  },
  // Workouts
  { id: "workout_1",       emoji: "💪", name: "First Lift",        description: "Logged first workout",                   xpReward: 10  },
  { id: "workout_10",      emoji: "🏋️", name: "Gym Regular",      description: "10 workouts logged",                     xpReward: 50  },
  { id: "workout_30",      emoji: "🦾", name: "Iron Athlete",      description: "30 workouts logged",                     xpReward: 150 },
  // Steps
  { id: "steps_10k",       emoji: "👟", name: "10K Club",          description: "Logged 10,000+ steps in a day",          xpReward: 20  },
  { id: "steps_5x",        emoji: "🚶", name: "Walking Machine",   description: "Logged 10k+ steps 5 times",              xpReward: 50  },
  // Weight loss
  { id: "loss_1lb",        emoji: "📉", name: "First Pound",       description: "Lost your first pound",                  xpReward: 30  },
  { id: "loss_5lb",        emoji: "🎉", name: "Five Down",         description: "Lost 5 lbs from starting weight",        xpReward: 100 },
  { id: "loss_10lb",       emoji: "🌟", name: "Ten Down",          description: "Lost 10 lbs from starting weight",       xpReward: 200 },
  // Program
  { id: "meal_plan",       emoji: "📋", name: "Meal Prepper",      description: "Generated your first meal plan",         xpReward: 15  },
  { id: "level_5",         emoji: "🥈", name: "Dedicated",         description: "Reached Level 5",                       xpReward: 0   },
  { id: "level_10",        emoji: "🥇", name: "Champion",          description: "Reached Level 10",                      xpReward: 0   },
];

export const BADGE_MAP = Object.fromEntries(BADGES.map((b) => [b.id, b]));

/** XP needed to reach a given level (level 1 = 0 XP) */
export function xpForLevel(level: number): number {
  // 0, 100, 250, 450, 700, 1000, 1350 … (+100, +150, +200, +250, +300 …)
  if (level <= 1) return 0;
  let total = 0;
  for (let l = 2; l <= level; l++) total += 50 + (l - 1) * 50;
  return total;
}

export function levelFromXP(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

export function xpProgress(xp: number): { level: number; current: number; needed: number; pct: number } {
  const level   = levelFromXP(xp);
  const floor   = xpForLevel(level);
  const ceiling = xpForLevel(level + 1);
  const current = xp - floor;
  const needed  = ceiling - floor;
  return { level, current, needed, pct: Math.round((current / needed) * 100) };
}

/** XP awarded per check-in action */
export function checkInXP(data: {
  compliance: number;
  workoutCompleted: boolean;
  steps?: number;
  streakBonus: boolean;
}): number {
  let xp = 10; // base check-in
  if (data.compliance >= 8) xp += 5;
  if (data.compliance === 10) xp += 5;
  if (data.workoutCompleted) xp += 10;
  if ((data.steps ?? 0) >= 10000) xp += 5;
  if (data.streakBonus) xp += 25; // 7-day streak milestone
  return xp;
}
