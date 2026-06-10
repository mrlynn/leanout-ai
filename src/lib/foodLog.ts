export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type FoodSource = "vision" | "manual" | "meal_plan" | "voice";

export interface FoodItem {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodLogEntryInput {
  date: string;
  mealType: MealType;
  source: FoodSource;
  foods: FoodItem[];
  notes?: string;
}

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
const FOOD_SOURCES: FoodSource[] = ["vision", "manual", "meal_plan", "voice"];

export function getDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function sumFoods(foods: FoodItem[]): MacroTotals {
  return foods.reduce(
    (acc, f) => ({
      calories: acc.calories + (f.calories || 0),
      protein: acc.protein + (f.protein || 0),
      carbs: acc.carbs + (f.carbs || 0),
      fat: acc.fat + (f.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export function aggregateDayTotals(
  entries: { foods: FoodItem[] }[]
): MacroTotals {
  return entries.reduce(
    (acc, entry) => {
      const t = sumFoods(entry.foods);
      return {
        calories: acc.calories + t.calories,
        protein: acc.protein + t.protein,
        carbs: acc.carbs + t.carbs,
        fat: acc.fat + t.fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export function isValidMealType(v: string): v is MealType {
  return MEAL_TYPES.includes(v as MealType);
}

export function isValidSource(v: string): v is FoodSource {
  return FOOD_SOURCES.includes(v as FoodSource);
}

export function validateFoods(foods: unknown): foods is FoodItem[] {
  if (!Array.isArray(foods) || foods.length === 0) return false;
  return foods.every(
    (f) =>
      typeof f === "object" &&
      f !== null &&
      typeof (f as FoodItem).name === "string" &&
      (f as FoodItem).name.trim().length > 0 &&
      typeof (f as FoodItem).quantity === "string" &&
      typeof (f as FoodItem).calories === "number" &&
      (f as FoodItem).calories >= 0 &&
      typeof (f as FoodItem).protein === "number" &&
      (f as FoodItem).protein >= 0 &&
      typeof (f as FoodItem).carbs === "number" &&
      (f as FoodItem).carbs >= 0 &&
      typeof (f as FoodItem).fat === "number" &&
      (f as FoodItem).fat >= 0
  );
}

export function mealPlanFoodToFoodItem(food: {
  item: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}): FoodItem {
  return {
    name: food.item,
    quantity: food.quantity,
    calories: food.calories,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
  };
}

export function inferMealTypeFromName(mealName: string): MealType {
  const lower = mealName.toLowerCase();
  if (lower.includes("breakfast")) return "breakfast";
  if (lower.includes("lunch")) return "lunch";
  if (lower.includes("dinner")) return "dinner";
  return "snack";
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function getTodayDayName(): string {
  return DAY_NAMES[new Date().getDay()];
}

export interface DayFoodSummary {
  date: string;
  logged: boolean;
  totals?: MacroTotals;
  meals?: string[];
}

export interface TodayFoodDetail {
  date: string;
  totals: MacroTotals;
  items: { mealType: string; name: string; calories: number; protein: number }[];
}

export interface FoodLogSummary {
  days: DayFoodSummary[];
  loggedDayCount: number;
  averages?: MacroTotals;
  patterns: string[];
  today: TodayFoodDetail;
}

export function formatFoodLogSummaryForPrompt(summary: FoodLogSummary, targets: MacroTotals): string {
  const lines: string[] = [];
  lines.push(`## Food Log (last ${summary.days.length} days)`);
  lines.push(`Targets: ${targets.calories} kcal · ${targets.protein}P / ${targets.carbs}C / ${targets.fat}F`);
  lines.push("");
  lines.push("Date        Kcal    P    C    F    Meals");

  for (const d of summary.days) {
    if (!d.logged) {
      lines.push(`${d.date}  (not logged)`);
    } else {
      const t = d.totals!;
      const meals = (d.meals ?? []).join(",");
      lines.push(
        `${d.date}  ${String(Math.round(t.calories)).padStart(4)}  ${String(Math.round(t.protein)).padStart(3)}  ${String(Math.round(t.carbs)).padStart(3)}  ${String(Math.round(t.fat)).padStart(3)}   ${meals}`
      );
    }
  }

  if (summary.loggedDayCount > 0 && summary.averages) {
    const a = summary.averages;
    const tDiff = (v: number, t: number) => {
      const d = Math.round(v - t);
      return d >= 0 ? `+${d}` : `${d}`;
    };
    lines.push("");
    lines.push(
      `${summary.loggedDayCount}-day logged-day averages: ${a.calories} kcal · ${a.protein}P (${tDiff(a.protein, targets.protein)} vs target) · ${a.carbs}C · ${a.fat}F`
    );
    if (summary.patterns.length > 0) {
      lines.push(`Patterns: ${summary.patterns.join(" ")}`);
    }
  }

  const { today } = summary;
  const rem = {
    calories: Math.max(0, targets.calories - today.totals.calories),
    protein: Math.max(0, targets.protein - today.totals.protein),
    carbs: Math.max(0, targets.carbs - today.totals.carbs),
    fat: Math.max(0, targets.fat - today.totals.fat),
  };
  lines.push("");
  lines.push(`## Today (${today.date}) — so far`);
  lines.push(
    `Consumed: ${Math.round(today.totals.calories)} kcal · ${Math.round(today.totals.protein)}P / ${Math.round(today.totals.carbs)}C / ${Math.round(today.totals.fat)}F`
  );
  lines.push(`Remaining: ${rem.calories} kcal · ${rem.protein}P / ${rem.carbs}C / ${rem.fat}F`);
  if (today.items.length > 0) {
    const grouped: Record<string, string[]> = {};
    for (const item of today.items) {
      if (!grouped[item.mealType]) grouped[item.mealType] = [];
      grouped[item.mealType].push(`${item.name} (${item.calories}kcal, ${Math.round(item.protein)}P)`);
    }
    for (const [mt, foods] of Object.entries(grouped)) {
      lines.push(`[${mt}] ${foods.join("; ")}`);
    }
  } else {
    lines.push("(nothing logged yet today)");
  }

  return lines.join("\n");
}

export function getDayNameFromStartDate(startDate: Date | string): string {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const idx = ((start.getDay() + diffDays) % 7 + 7) % 7;
  return DAY_NAMES[idx];
}
