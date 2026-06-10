import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import FoodLogEntry from "@/models/FoodLogEntry";
import { connectDB } from "@/lib/mongodb";
import {
  mergeFoodResults,
  searchOpenFoodFacts,
  searchUsdaFdc,
  type FoodSearchResult,
} from "@/lib/foodSearch";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ results: [], recents: [] });

  await connectDB();

  const entries = await FoodLogEntry.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .limit(80)
    .lean();

  const seen = new Set<string>();
  const recentFoods: FoodSearchResult[] = [];
  const qLower = q.toLowerCase();

  for (const entry of entries) {
    for (const food of entry.foods) {
      const key = food.name.toLowerCase();
      if (!seen.has(key) && key.includes(qLower)) {
        seen.add(key);
        recentFoods.push({
          name: food.name,
          quantity: food.quantity,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
          source: "recent",
        });
      }
      if (recentFoods.length >= 10) break;
    }
    if (recentFoods.length >= 10) break;
  }

  const [usda, off] = await Promise.all([
    searchUsdaFdc(q, 12).catch(() => [] as FoodSearchResult[]),
    searchOpenFoodFacts(q, 12).catch(() => [] as FoodSearchResult[]),
  ]);

  const results = mergeFoodResults(usda, off, recentFoods);

  return NextResponse.json({ results, recents: recentFoods });
}
