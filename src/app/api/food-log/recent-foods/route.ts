import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import FoodLogEntry from "@/models/FoodLogEntry";
import { getDateString } from "@/lib/foodLog";
import type { FoodItem } from "@/lib/foodLog";

export interface RecentFood extends FoodItem {
  lastUsed: string;
  useCount: number;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffDate = getDateString(cutoff);

  const entries = await FoodLogEntry.find({
    userId: session.user.id,
    date: { $gte: cutoffDate },
  })
    .sort({ date: -1 })
    .lean();

  // Flatten all food items, track frequency and most-recent date per normalized name
  const map = new Map<
    string,
    { food: FoodItem; lastUsed: string; useCount: number }
  >();

  for (const entry of entries) {
    for (const food of entry.foods as FoodItem[]) {
      const key = food.name.trim().toLowerCase();
      const existing = map.get(key);
      if (!existing) {
        map.set(key, { food, lastUsed: entry.date, useCount: 1 });
      } else {
        existing.useCount += 1;
        if (entry.date > existing.lastUsed) {
          existing.lastUsed = entry.date;
          existing.food = food;
        }
      }
    }
  }

  // Sort: most frequent first, then most recent
  const sorted = Array.from(map.values()).sort((a, b) => {
    if (b.useCount !== a.useCount) return b.useCount - a.useCount;
    return b.lastUsed.localeCompare(a.lastUsed);
  });

  const recentFoods: RecentFood[] = sorted.slice(0, 20).map(({ food, lastUsed, useCount }) => ({
    ...food,
    lastUsed,
    useCount,
  }));

  return NextResponse.json({ recentFoods }, {
    headers: { "Cache-Control": "private, max-age=60" },
  });
}
