import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import FoodLogEntry from "@/models/FoodLogEntry";
import { macrosFromUser } from "@/lib/physique";
import { gradeFoodItem } from "@/lib/foodGrade";
import { getDateString, aggregateDayTotals } from "@/lib/foodLog";
import type { FoodItem } from "@/lib/foodLog";

interface OpenFoodFactsNutriments {
  "energy-kcal_100g"?: number;
  "energy-kcal_serving"?: number;
  proteins_100g?: number;
  proteins_serving?: number;
  carbohydrates_100g?: number;
  carbohydrates_serving?: number;
  fat_100g?: number;
  fat_serving?: number;
}

interface OpenFoodFactsProduct {
  product_name?: string;
  brands?: string;
  serving_size?: string;
  serving_quantity?: number;
  nutriments?: OpenFoodFactsNutriments;
  image_front_small_url?: string;
}

interface OpenFoodFactsResponse {
  status: number; // 1 = found, 0 = not found
  product?: OpenFoodFactsProduct;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const code = new URL(req.url).searchParams.get("code");
  if (!code || !/^\d{6,14}$/.test(code)) {
    return NextResponse.json({ error: "Invalid barcode" }, { status: 400 });
  }

  const offUrl = `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(code)}.json`;

  let data: OpenFoodFactsResponse;
  try {
    const res = await fetch(offUrl, {
      headers: { "User-Agent": "LeanOutAI/1.0 (contact@leanout.ai)" },
      // 5 second timeout
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`OFF returned ${res.status}`);
    data = await res.json();
  } catch {
    return NextResponse.json({ error: "Could not reach food database — check your connection" }, { status: 502 });
  }

  if (data.status !== 1 || !data.product) {
    return NextResponse.json({ error: "Product not found. Try logging manually." }, { status: 404 });
  }

  const p = data.product;
  const n = p.nutriments ?? {};

  // Prefer per-serving values when a serving size is defined, else use per-100g
  const hasServingData =
    p.serving_quantity && p.serving_quantity > 0 && n["energy-kcal_serving"] != null;

  const servingGrams = hasServingData ? (p.serving_quantity ?? 100) : 100;
  const servingLabel = p.serving_size ?? `${servingGrams}g`;

  const calories = Math.round(
    hasServingData ? (n["energy-kcal_serving"] ?? 0) : (n["energy-kcal_100g"] ?? 0)
  );
  const protein = Math.round(
    hasServingData ? (n.proteins_serving ?? 0) : (n.proteins_100g ?? 0)
  );
  const carbs = Math.round(
    hasServingData ? (n.carbohydrates_serving ?? 0) : (n.carbohydrates_100g ?? 0)
  );
  const fat = Math.round(
    hasServingData ? (n.fat_serving ?? 0) : (n.fat_100g ?? 0)
  );

  // Also return per-100g so the client can rescale for custom serving sizes
  const per100g = {
    calories: Math.round(n["energy-kcal_100g"] ?? 0),
    protein: Math.round(n.proteins_100g ?? 0),
    carbs: Math.round(n.carbohydrates_100g ?? 0),
    fat: Math.round(n.fat_100g ?? 0),
  };

  // Compute food grade against user goals + today's totals
  let grade = null;
  try {
    await connectDB();
    const [user, todayEntries] = await Promise.all([
      User.findById(session.user.id).lean(),
      FoodLogEntry.find({ userId: session.user.id, date: getDateString() }).lean(),
    ]);
    const macros = user ? macrosFromUser(user) : null;
    if (macros) {
      const food: FoodItem = { name: [p.product_name, p.brands].filter(Boolean).join(" — ") || "Unknown product", quantity: servingLabel, calories, protein, carbs, fat };
      const dayTotals = aggregateDayTotals(todayEntries as { foods: FoodItem[] }[]);
      grade = gradeFoodItem(food, { calories: macros.calories, proteinG: macros.proteinG, carbsG: macros.carbsG, fatG: macros.fatG, goalType: user?.goalType }, dayTotals);
    }
  } catch {
    // Grade is best-effort; never fail the barcode lookup because of it
  }

  return NextResponse.json({
    barcode: code,
    name: [p.product_name, p.brands].filter(Boolean).join(" — ") || "Unknown product",
    image: p.image_front_small_url ?? null,
    servingLabel,
    servingGrams,
    calories,
    protein,
    carbs,
    fat,
    per100g,
    grade,
  });
}
