import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import FoodLogEntry from "@/models/FoodLogEntry";
import { connectDB } from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ results: [], recents: [] });

  await connectDB();

  const recents = await FoodLogEntry.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const seen = new Set<string>();
  const recentFoods: { name: string; quantity: string; calories: number; protein: number; carbs: number; fat: number }[] = [];
  for (const entry of recents) {
    for (const food of entry.foods) {
      const key = food.name.toLowerCase();
      if (!seen.has(key) && key.includes(q.toLowerCase())) {
        seen.add(key);
        recentFoods.push(food);
      }
      if (recentFoods.length >= 8) break;
    }
    if (recentFoods.length >= 8) break;
  }

  let external: { name: string; quantity: string; calories: number; protein: number; carbs: number; fat: number }[] = [];
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=8`,
      { signal: AbortSignal.timeout(5000) }
    );
    const data = await res.json();
    external = (data.products ?? []).slice(0, 8).map((p: Record<string, unknown>) => {
      const n = (p.nutriments ?? {}) as Record<string, number>;
      return {
        name: String(p.product_name ?? "Unknown"),
        quantity: "100g",
        calories: Math.round(n["energy-kcal_100g"] ?? n.energy_100g ?? 0),
        protein: Math.round(n.proteins_100g ?? 0),
        carbs: Math.round(n.carbohydrates_100g ?? 0),
        fat: Math.round(n.fat_100g ?? 0),
      };
    });
  } catch {
    // external search optional
  }

  return NextResponse.json({ results: external, recents: recentFoods });
}
