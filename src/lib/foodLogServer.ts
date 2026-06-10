import FoodLogEntry from "@/models/FoodLogEntry";
import { aggregateDayTotals, getDateString, sumFoods, type MealType, type FoodLogSummary, type DayFoodSummary, type TodayFoodDetail } from "@/lib/foodLog";

const MEAL_ABBREV: Record<MealType, string> = { breakfast: "B", lunch: "L", dinner: "D", snack: "S" };

export async function getFoodLogSummary(userId: string, days = 14): Promise<FoodLogSummary> {
  const todayStr = getDateString();
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  const startStr = getDateString(start);

  const entries = await FoodLogEntry.find({ userId, date: { $gte: startStr, $lte: todayStr } })
    .sort({ date: -1 })
    .lean();

  const byDate = new Map<string, typeof entries>();
  for (const e of entries) {
    if (!byDate.has(e.date)) byDate.set(e.date, []);
    byDate.get(e.date)!.push(e);
  }

  const dayList: DayFoodSummary[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = getDateString(d);
    const dayEntries = byDate.get(dateStr);
    if (!dayEntries || dayEntries.length === 0) {
      dayList.push({ date: dateStr, logged: false });
    } else {
      const totals = aggregateDayTotals(dayEntries);
      const meals = [...new Set(dayEntries.map((e) => MEAL_ABBREV[e.mealType as MealType] ?? "?"))].sort();
      dayList.push({ date: dateStr, logged: true, totals, meals });
    }
  }

  const loggedDays = dayList.filter((d) => d.logged);
  const loggedDayCount = loggedDays.length;
  let averages: FoodLogSummary["averages"];
  if (loggedDayCount > 0) {
    const sum = loggedDays.reduce(
      (acc, d) => ({
        calories: acc.calories + (d.totals?.calories ?? 0),
        protein: acc.protein + (d.totals?.protein ?? 0),
        carbs: acc.carbs + (d.totals?.carbs ?? 0),
        fat: acc.fat + (d.totals?.fat ?? 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    averages = {
      calories: Math.round(sum.calories / loggedDayCount),
      protein: Math.round(sum.protein / loggedDayCount),
      carbs: Math.round(sum.carbs / loggedDayCount),
      fat: Math.round(sum.fat / loggedDayCount),
    };
  }

  const patterns: string[] = [];
  if (loggedDayCount >= 3) {
    const mealProtein: Record<string, { total: number; count: number }> = {};
    for (const e of entries) {
      const mt = e.mealType as MealType;
      if (!mealProtein[mt]) mealProtein[mt] = { total: 0, count: 0 };
      mealProtein[mt].total += sumFoods(e.foods).protein;
      mealProtein[mt].count++;
    }
    let lowestMeal = "";
    let lowestAvg = Infinity;
    for (const [mt, v] of Object.entries(mealProtein)) {
      const avg = v.total / v.count;
      if (avg < lowestAvg) { lowestAvg = avg; lowestMeal = mt; }
    }
    if (lowestMeal && lowestAvg < 20) {
      patterns.push(`Protein shortfall concentrated at ${lowestMeal} (avg ${Math.round(lowestAvg)}g).`);
    }

    const weekdayCals: number[] = [];
    const weekendCals: number[] = [];
    for (const d of loggedDays) {
      const dow = new Date(d.date + "T12:00:00").getDay();
      if (dow === 0 || dow === 6) weekendCals.push(d.totals!.calories);
      else weekdayCals.push(d.totals!.calories);
    }
    if (weekdayCals.length >= 2 && weekendCals.length >= 1) {
      const wdAvg = weekdayCals.reduce((a, b) => a + b, 0) / weekdayCals.length;
      const weAvg = weekendCals.reduce((a, b) => a + b, 0) / weekendCals.length;
      const pct = Math.round(((weAvg - wdAvg) / wdAvg) * 100);
      if (Math.abs(pct) >= 10) {
        patterns.push(`Weekend calories avg ${pct > 0 ? "+" : ""}${pct}% vs weekdays.`);
      }
    }
  }

  const todayEntries = byDate.get(todayStr) ?? [];
  const todayItems: TodayFoodDetail["items"] = [];
  for (const e of todayEntries) {
    for (const f of e.foods) {
      todayItems.push({ mealType: e.mealType, name: f.name, calories: f.calories, protein: f.protein });
    }
  }
  const today: TodayFoodDetail = {
    date: todayStr,
    totals: aggregateDayTotals(todayEntries),
    items: todayItems,
  };

  return { days: dayList, loggedDayCount, averages, patterns, today };
}
