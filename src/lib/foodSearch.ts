export interface FoodSearchResult {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: "usda" | "openfoodfacts" | "recent";
  brand?: string;
  fdcId?: number;
}

function per100gToServing(
  per100: { calories: number; protein: number; carbs: number; fat: number },
  servingGrams: number,
  label: string
): Omit<FoodSearchResult, "name" | "source" | "brand" | "fdcId"> {
  const factor = servingGrams / 100;
  return {
    quantity: label,
    calories: Math.round(per100.calories * factor),
    protein: Math.round(per100.protein * factor),
    carbs: Math.round(per100.carbs * factor),
    fat: Math.round(per100.fat * factor),
  };
}

export async function searchUsdaFdc(query: string, pageSize = 12): Promise<FoodSearchResult[]> {
  const apiKey = process.env.USDA_FDC_API_KEY ?? "DEMO_KEY";
  const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", query);
  url.searchParams.set("pageSize", String(pageSize));
  url.searchParams.set("dataType", "Foundation,SR Legacy,Branded");

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(6000) });
  if (!res.ok) return [];
  const data = await res.json();
  const foods = (data.foods ?? []) as Array<{
    fdcId: number;
    description: string;
    brandOwner?: string;
    servingSize?: number;
    servingSizeUnit?: string;
    foodNutrients?: Array<{ nutrientNumber?: string; value?: number }>;
  }>;

  return foods.map((food) => {
    const nutrients = food.foodNutrients ?? [];
    const get = (num: string) => nutrients.find((n) => n.nutrientNumber === num)?.value ?? 0;
    const servingG =
      food.servingSize && food.servingSizeUnit?.toLowerCase() === "g"
        ? food.servingSize
        : 100;
    const per100 = {
      calories: get("208") || get("957") || 0,
      protein: get("203") || 0,
      carbs: get("205") || 0,
      fat: get("204") || 0,
    };
    const label =
      servingG !== 100 ? `${servingG}g serving` : "100g";
    const macros = per100gToServing(per100, servingG, label);
    return {
      name: food.description,
      brand: food.brandOwner,
      fdcId: food.fdcId,
      source: "usda" as const,
      ...macros,
    };
  });
}

export async function searchOpenFoodFacts(query: string, pageSize = 12): Promise<FoodSearchResult[]> {
  const res = await fetch(
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${pageSize}`,
    { signal: AbortSignal.timeout(5000) }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.products ?? []).map((p: Record<string, unknown>) => {
    const n = (p.nutriments ?? {}) as Record<string, number>;
    const servingG = Number(n.serving_size) || 100;
    const per100 = {
      calories: Math.round(n["energy-kcal_100g"] ?? n.energy_100g ?? 0),
      protein: Math.round(n.proteins_100g ?? 0),
      carbs: Math.round(n.carbohydrates_100g ?? 0),
      fat: Math.round(n.fat_100g ?? 0),
    };
    const label = servingG !== 100 ? `${servingG}g` : "100g";
    return {
      name: String(p.product_name ?? "Unknown"),
      brand: p.brands ? String(p.brands) : undefined,
      source: "openfoodfacts" as const,
      ...per100gToServing(per100, servingG, label),
    };
  });
}

/** Merge USDA + OFF + recents, dedupe by normalized name. */
export function mergeFoodResults(
  usda: FoodSearchResult[],
  off: FoodSearchResult[],
  recents: FoodSearchResult[]
): FoodSearchResult[] {
  const seen = new Set<string>();
  const out: FoodSearchResult[] = [];

  for (const list of [recents, usda, off]) {
    for (const item of list) {
      const key = item.name.toLowerCase().replace(/\s+/g, " ").trim();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
      if (out.length >= 20) return out;
    }
  }
  return out;
}
