import mongoose from "mongoose";
import DailyCheckIn from "@/models/DailyCheckIn";
import FoodLogEntry from "@/models/FoodLogEntry";
import QuestAssignment, { IQuestSlot } from "@/models/QuestAssignment";
import User from "@/models/User";
import { getDateString } from "@/lib/foodLog";
import { macrosFromUser } from "@/lib/physique";

export interface CompletedQuest {
  id: string;
  name: string;
  xpReward: number;
}

// ── Quest definitions ────────────────────────────────────────────────────────

export type QuestCategory = "nutrition" | "activity" | "engagement";

export interface QuestDef {
  id: string;
  name: string;
  description: (params: Record<string, unknown>) => string;
  category: QuestCategory;
  xpReward: number;
}

export const QUEST_DEFS: QuestDef[] = [
  {
    id: "protein_pro",
    name: "Protein Pro",
    description: (p) => `Hit ≥ 90% protein target on ${p.days} days this week`,
    category: "nutrition",
    xpReward: 30,
  },
  {
    id: "full_logger",
    name: "Full Logger",
    description: () => "Log ≥ 2 meals on 6 days this week",
    category: "nutrition",
    xpReward: 25,
  },
  {
    id: "clean_sweep",
    name: "Clean Sweep",
    description: () => "Hit compliance ≥ 8 every day you check in this week",
    category: "nutrition",
    xpReward: 30,
  },
  {
    id: "step_it_up",
    name: "Step It Up",
    description: (p) => `Hit ${p.stepTarget} steps on ${p.days} days this week`,
    category: "activity",
    xpReward: 25,
  },
  {
    id: "early_bird",
    name: "Early Bird",
    description: () => "Check in before noon on 5 days this week",
    category: "engagement",
    xpReward: 20,
  },
  {
    id: "weigh_steady",
    name: "Weigh Steady",
    description: () => "Log your weight on 5 days this week",
    category: "engagement",
    xpReward: 20,
  },
];

export const QUEST_MAP = Object.fromEntries(QUEST_DEFS.map((q) => [q.id, q]));

// ── Week helpers ─────────────────────────────────────────────────────────────

/** Returns Monday of the current week as "YYYY-MM-DD" */
export function currentWeekStart(now = new Date()): string {
  const d = new Date(now);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

/** Returns Date bounds (exclusive end) and inclusive YYYY-MM-DD strings for the week. */
function weekBounds(weekStart: string) {
  const start = new Date(weekStart + "T00:00:00.000Z");
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  const sunday = new Date(start);
  sunday.setDate(sunday.getDate() + 6);
  return { start, end, startStr: weekStart, endStr: getDateString(sunday) };
}

function hourInTimezone(date: Date, timezone: string): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    }).formatToParts(date);
    const hour = parts.find((p) => p.type === "hour")?.value;
    return hour ? parseInt(hour, 10) % 24 : date.getHours();
  } catch {
    return date.getHours();
  }
}

function scaledStepTarget(avgSteps: number): number {
  if (avgSteps <= 0) return 8000;
  return Math.max(6000, Math.round((avgSteps * 1.1) / 500) * 500);
}

// ── Quest selection ───────────────────────────────────────────────────────────

/**
 * Deterministically pick one quest from each category.
 * Uses weekStart + userId hash so different users get varied quests.
 */
function pickQuests(userId: string, weekStart: string): string[] {
  const hash = simpleHash(userId + weekStart);

  const nutrition = ["protein_pro", "full_logger", "clean_sweep"];
  const activity = ["step_it_up"];
  const engagement = ["early_bird", "weigh_steady"];

  return [
    nutrition[hash % nutrition.length],
    activity[hash % activity.length],
    engagement[hash % engagement.length],
  ];
}

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// ── Difficulty params ─────────────────────────────────────────────────────────

async function buildParams(
  userId: string,
  questId: string
): Promise<{ params: Record<string, unknown>; target: number }> {
  // Trailing 4-week averages for difficulty scaling
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  switch (questId) {
    case "protein_pro": {
      // Count days with food logs in trailing 4 weeks to gauge engagement
      const loggedDays = await FoodLogEntry.distinct("date", {
        userId,
        date: { $gte: fourWeeksAgo },
      });
      const days = loggedDays.length >= 20 ? 5 : 4;
      return { params: { days }, target: days };
    }
    case "step_it_up": {
      const checkIns = await DailyCheckIn.find({
        userId,
        date: { $gte: fourWeeksAgo },
        steps: { $exists: true },
      })
        .select("steps")
        .lean();
      const avgSteps =
        checkIns.length > 0
          ? checkIns.reduce((s, c) => s + (c.steps ?? 0), 0) / checkIns.length
          : 0;
      const days = avgSteps >= 8000 ? 5 : 4;
      const stepTarget = scaledStepTarget(avgSteps);
      return { params: { days, stepTarget }, target: days };
    }
    case "full_logger":
      return { params: {}, target: 6 };
    case "clean_sweep":
      return { params: {}, target: 1 }; // target = 1 means "all logged days"
    case "early_bird":
      return { params: {}, target: 5 };
    case "weigh_steady":
      return { params: {}, target: 5 };
    default:
      return { params: {}, target: 1 };
  }
}

// ── Assignment (lazy) ────────────────────────────────────────────────────────

export async function getOrAssignQuests(userId: string): Promise<IQuestSlot[]> {
  const weekStart = currentWeekStart();
  const existing = await QuestAssignment.findOne({ userId, weekStart }).lean();
  if (existing) return existing.quests;

  const questIds = pickQuests(userId, weekStart);
  const slots: IQuestSlot[] = await Promise.all(
    questIds.map(async (questId) => {
      const { params, target } = await buildParams(userId, questId);
      return { questId, params, progress: 0, target, xpAwarded: false };
    })
  );

  await QuestAssignment.findOneAndUpdate(
    { userId, weekStart },
    { userId, weekStart, quests: slots },
    { upsert: true, new: true }
  );

  return slots;
}

// ── Progress evaluation ───────────────────────────────────────────────────────

/**
 * Recomputes progress for all active quests and awards XP for newly completed ones.
 * Returns any newly completed quest ids.
 */
export async function evaluateQuests(userId: string): Promise<string[]> {
  const completed = await evaluateQuestsDetailed(userId);
  return completed.map((q) => q.id);
}

export async function evaluateQuestsDetailed(userId: string): Promise<CompletedQuest[]> {
  const weekStart = currentWeekStart();
  const assignment = await QuestAssignment.findOne({ userId, weekStart });
  if (!assignment) return [];

  const bounds = weekBounds(weekStart);
  const user = await User.findById(userId)
    .select(
      "timezone weightLbs bodyFatPercent heightInches age sex activityLevel goalType goalBodyFatPercent macroOverrideCalories macroOverrideProteinG macroOverrideCarbsG macroOverrideFatG"
    )
    .lean();

  const newlyCompleted: CompletedQuest[] = [];

  for (let i = 0; i < assignment.quests.length; i++) {
    const slot = assignment.quests[i];
    if (slot.completedAt) continue;

    const progress = await computeProgress(userId, slot.questId, slot.params, bounds, user);
    slot.progress = progress;

    if (progress >= slot.target && !slot.completedAt) {
      slot.completedAt = new Date();
      if (!slot.xpAwarded) {
        slot.xpAwarded = true;
        const def = QUEST_MAP[slot.questId];
        const xp = def?.xpReward ?? 0;
        await User.findByIdAndUpdate(userId, {
          $inc: { xp, xpSpendable: xp },
        });
        newlyCompleted.push({
          id: slot.questId,
          name: def?.name ?? slot.questId,
          xpReward: xp,
        });
      }
    }
  }

  assignment.markModified("quests");
  await assignment.save();
  return newlyCompleted;
}

/** Ensure this week's quests exist and refresh progress. */
export async function refreshQuestProgress(userId: string): Promise<string[]> {
  await getOrAssignQuests(userId);
  return evaluateQuests(userId);
}

type QuestUser = {
  timezone?: string;
  weightLbs?: number;
  bodyFatPercent?: number;
  heightInches?: number;
  age?: number;
  sex?: string;
  activityLevel?: string;
  goalType?: string;
  goalBodyFatPercent?: number;
  macroOverrideCalories?: number;
  macroOverrideProteinG?: number;
  macroOverrideCarbsG?: number;
  macroOverrideFatG?: number;
} | null;

async function computeProgress(
  userId: string,
  questId: string,
  params: Record<string, unknown>,
  bounds: ReturnType<typeof weekBounds>,
  user: QuestUser
): Promise<number> {
  const uidObj = new mongoose.Types.ObjectId(userId);
  const { start, end, startStr, endStr } = bounds;

  switch (questId) {
    case "protein_pro": {
      const macros = user ? macrosFromUser(user) : null;
      const proteinTarget = macros?.proteinG ?? 150;
      const threshold = proteinTarget * 0.9;

      const entries = await FoodLogEntry.aggregate([
        { $match: { userId: uidObj, date: { $gte: startStr, $lte: endStr } } },
        { $unwind: "$foods" },
        {
          $group: {
            _id: "$date",
            totalProtein: { $sum: "$foods.protein" },
          },
        },
      ]);

      const daysHit = entries.filter((e) => (e.totalProtein ?? 0) >= threshold).length;
      return Math.min(daysHit, params.days as number);
    }

    case "full_logger": {
      const entries = await FoodLogEntry.aggregate([
        { $match: { userId: uidObj, date: { $gte: startStr, $lte: endStr } } },
        { $group: { _id: "$date", count: { $sum: 1 } } },
        { $match: { count: { $gte: 2 } } },
      ]);
      return entries.length;
    }

    case "clean_sweep": {
      const checkIns = await DailyCheckIn.find({
        userId,
        date: { $gte: start, $lt: end },
      })
        .select("compliance")
        .lean();
      if (checkIns.length === 0) return 0;
      const allClean = checkIns.every((c) => c.compliance >= 8);
      return allClean ? 1 : 0;
    }

    case "step_it_up": {
      const stepTarget = (params.stepTarget as number) ?? 8000;
      const checkIns = await DailyCheckIn.find({
        userId,
        date: { $gte: start, $lt: end },
        steps: { $gte: 1 },
      })
        .select("steps")
        .lean();
      const daysHit = checkIns.filter((c) => (c.steps ?? 0) >= stepTarget).length;
      return Math.min(daysHit, params.days as number);
    }

    case "early_bird": {
      const tz = user?.timezone ?? "America/New_York";
      const checkIns = await DailyCheckIn.find({
        userId,
        date: { $gte: start, $lt: end },
      })
        .select("createdAt")
        .lean();
      const earlyDays = checkIns.filter((c) => {
        return hourInTimezone(new Date(c.createdAt), tz) < 12;
      }).length;
      return earlyDays;
    }

    case "weigh_steady": {
      const count = await DailyCheckIn.countDocuments({
        userId,
        date: { $gte: start, $lt: end },
        weightLbs: { $exists: true, $gt: 0 },
      });
      return count;
    }

    default:
      return 0;
  }
}
