import FoodLogEntry from "@/models/FoodLogEntry";
import { aggregateDayTotals } from "@/lib/foodLog";

export function dateStringDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

export async function getMacroAdherence(
  userId: string,
  targets: { calories: number; proteinG: number; carbsG: number; fatG: number },
  days = 7
) {
  const start = dateStringDaysAgo(days - 1);
  const entries = await FoodLogEntry.find({ userId, date: { $gte: start } }).lean();

  const byDate: Record<string, typeof entries> = {};
  for (const e of entries) {
    if (!byDate[e.date]) byDate[e.date] = [];
    byDate[e.date].push(e);
  }

  const daily = [];
  let proteinHitDays = 0;
  let calorieHitDays = 0;
  let loggedDays = 0;

  for (let i = days - 1; i >= 0; i--) {
    const date = dateStringDaysAgo(i);
    const dayEntries = byDate[date] ?? [];
    if (dayEntries.length > 0) loggedDays++;
    const totals = aggregateDayTotals(dayEntries);
    const proteinPct = targets.proteinG > 0 ? Math.round((totals.protein / targets.proteinG) * 100) : 0;
    const caloriePct = targets.calories > 0 ? Math.round((totals.calories / targets.calories) * 100) : 0;
    if (totals.protein >= targets.proteinG * 0.9) proteinHitDays++;
    if (totals.calories >= targets.calories * 0.85 && totals.calories <= targets.calories * 1.15) calorieHitDays++;
    daily.push({ date, ...totals, proteinPct, caloriePct, logged: dayEntries.length > 0 });
  }

  return {
    daily,
    loggedDays,
    proteinHitDays,
    calorieHitDays,
    proteinHitRate: Math.round((proteinHitDays / days) * 100),
    calorieHitRate: Math.round((calorieHitDays / days) * 100),
  };
}

/** Rough adaptive TDEE from intake + weight change over period */
export function estimateExpenditure(
  avgIntake: number,
  weightChangeLbs: number,
  days: number
) {
  if (days <= 0 || avgIntake <= 0) return null;
  const dailyWeightChange = weightChangeLbs / days;
  const kcalPerLb = 3500;
  return Math.round(avgIntake - dailyWeightChange * kcalPerLb);
}
