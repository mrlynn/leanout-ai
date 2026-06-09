"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { RefreshCw, ShoppingCart, CalendarDays, Loader2, ChevronDown, ChevronUp, X, ClipboardPlus } from "lucide-react";
import { useUpgradeModal, handleLimitReached } from "@/components/UpgradeModal";

interface Food { item: string; quantity: string; calories: number; protein: number; carbs: number; fat: number; }
interface Meal { name: string; foods: Food[]; totalCalories: number; totalProtein: number; totalCarbs: number; totalFat: number; }
interface Day  { day: string; meals: Meal[]; totalCalories: number; totalProtein: number; totalCarbs: number; totalFat: number; }
interface GroceryList { protein: string[]; vegetables: string[]; fruits: string[]; carbs: string[]; fats: string[]; condiments: string[]; }
interface MealPlanData { days: Day[]; groceryList: GroceryList; calories: number; protein: number; carbs: number; fat: number; }

const MEAL_COLORS: Record<string, { dot: string; bg: string; text: string }> = {
  Breakfast: { dot: "bg-amber-400",  bg: "bg-amber-50",  text: "text-amber-700" },
  Lunch:     { dot: "bg-green-500",  bg: "bg-green-50",  text: "text-green-700" },
  Dinner:    { dot: "bg-blue-500",   bg: "bg-blue-50",   text: "text-blue-700"  },
  Snack:     { dot: "bg-purple-400", bg: "bg-purple-50", text: "text-purple-700" },
};
function mealColor(name: string) {
  for (const key of Object.keys(MEAL_COLORS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return MEAL_COLORS[key];
  }
  return { dot: "bg-gray-400", bg: "bg-gray-50", text: "text-gray-600" };
}

const GROCERY_CONFIG: Record<keyof GroceryList, { label: string; dot: string; badge: string }> = {
  protein:    { label: "Protein",    dot: "bg-blue-500",   badge: "bg-blue-50 text-blue-700 border-blue-100" },
  vegetables: { label: "Vegetables", dot: "bg-green-500",  badge: "bg-green-50 text-green-700 border-green-100" },
  fruits:     { label: "Fruits",     dot: "bg-pink-500",   badge: "bg-pink-50 text-pink-700 border-pink-100" },
  carbs:      { label: "Carbs",      dot: "bg-amber-500",  badge: "bg-amber-50 text-amber-700 border-amber-100" },
  fats:       { label: "Fats",       dot: "bg-orange-500", badge: "bg-orange-50 text-orange-700 border-orange-100" },
  condiments: { label: "Condiments", dot: "bg-gray-400",   badge: "bg-gray-50 text-gray-600 border-gray-200" },
};

const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ─── Macro bar ────────────────────────────────────────────────── */
function MacroBar({ actual, target, color }: { actual: number; target: number; color: string }) {
  const pct = Math.min(100, Math.round((actual / target) * 100));
  return (
    <div className="h-1 bg-black/10 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

const PREFILL_KEY = "food-log-prefill";

/* ─── Expanded meal detail panel (slide-up) ───────────────────── */
function MealDetail({ meal, onClose }: { meal: Meal; onClose: () => void }) {
  const router = useRouter();
  const c = mealColor(meal.name);

  function logMeal() {
    sessionStorage.setItem(
      PREFILL_KEY,
      JSON.stringify({ mealName: meal.name, foods: meal.foods, source: "meal_plan" })
    );
    router.push("/food-log");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-3xl w-full max-w-md card-shadow-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`${c.bg} px-6 py-5 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${c.dot}`} />
            <p className={`font-black text-lg ${c.text}`}>{meal.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-black/10 transition-colors">
            <X size={18} className={c.text} />
          </button>
        </div>

        {/* Macro totals */}
        <div className="grid grid-cols-4 divide-x divide-muted px-0 border-b border-muted">
          {[
            { label: "Calories", value: meal.totalCalories, unit: "" },
            { label: "Protein",  value: meal.totalProtein,  unit: "g" },
            { label: "Carbs",    value: meal.totalCarbs,    unit: "g" },
            { label: "Fat",      value: meal.totalFat,      unit: "g" },
          ].map((m) => (
            <div key={m.label} className="py-3 text-center">
              <p className="text-base font-black">{m.value}{m.unit}</p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Foods */}
        <div className="px-6 py-4 space-y-3 max-h-72 overflow-y-auto">
          {meal.foods.map((food, i) => (
            <div key={i} className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm leading-tight">{food.item}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{food.quantity}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold">{food.calories} kcal</p>
                <p className="text-xs text-muted-foreground">{food.protein}P · {food.carbs}C · {food.fat}F</p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 pb-5">
          <Button type="button" className="w-full gradient-orange text-white border-0" onClick={logMeal}>
            <ClipboardPlus size={16} className="mr-2" /> Log this meal
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Day column card ─────────────────────────────────────────── */
function DayCard({
  day, dayIndex, targets, isToday,
  onMealClick,
}: {
  day: Day;
  dayIndex: number;
  targets: { calories: number; protein: number; carbs: number; fat: number };
  isToday: boolean;
  onMealClick: (meal: Meal) => void;
}) {
  const calPct = Math.min(100, Math.round((day.totalCalories / targets.calories) * 100));

  return (
    <div className={`flex flex-col rounded-3xl overflow-hidden card-shadow min-w-[200px] md:min-w-0 ${
      isToday ? "ring-2 ring-primary" : ""
    }`}>
      {/* Day header */}
      <div className={`px-4 py-3 ${isToday ? "gradient-orange" : "bg-foreground"}`}>
        <p className={`text-xs font-bold uppercase tracking-widest ${isToday ? "text-orange-200" : "text-white/50"}`}>
          {DAYS_SHORT[dayIndex]}
        </p>
        <p className={`text-xl font-black ${isToday ? "text-white" : "text-white"}`}>{day.day}</p>

        {/* Calorie ring-style bar */}
        <div className="mt-3 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className={isToday ? "text-orange-200" : "text-white/60"}>Calories</span>
            <span className={`font-bold ${isToday ? "text-white" : "text-white"}`}>{day.totalCalories}</span>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${isToday ? "bg-white" : "bg-primary"}`}
              style={{ width: `${calPct}%` }}
            />
          </div>
        </div>

        {/* Macro dots */}
        <div className="mt-2 grid grid-cols-3 gap-1 text-center">
          {[
            { label: "P", value: day.totalProtein, color: "text-blue-300" },
            { label: "C", value: day.totalCarbs,   color: isToday ? "text-orange-200" : "text-amber-300" },
            { label: "F", value: day.totalFat,     color: isToday ? "text-orange-100" : "text-orange-300" },
          ].map((m) => (
            <div key={m.label}>
              <p className={`text-xs font-black ${m.color}`}>{m.value}g</p>
              <p className="text-white/40 text-[10px]">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Meals list */}
      <div className="flex-1 bg-white px-3 py-3 space-y-2">
        {day.meals.map((meal) => {
          const c = mealColor(meal.name);
          return (
            <button
              key={meal.name}
              onClick={() => onMealClick(meal)}
              className="w-full text-left group"
            >
              <div className="rounded-2xl p-3 hover:bg-muted/60 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-2 h-2 rounded-full ${c.dot} shrink-0`} />
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{meal.name}</p>
                  <span className="ml-auto text-xs font-bold text-muted-foreground">{meal.totalCalories}</span>
                </div>
                <div className="space-y-0.5 pl-4">
                  {meal.foods.slice(0, 3).map((food, fi) => (
                    <p key={fi} className="text-xs text-foreground/80 leading-snug truncate">{food.item}</p>
                  ))}
                  {meal.foods.length > 3 && (
                    <p className="text-xs text-muted-foreground">+{meal.foods.length - 3} more</p>
                  )}
                </div>
                {/* Macro bars */}
                <div className="mt-2 pl-4 space-y-1">
                  <MacroBar actual={meal.totalProtein} target={targets.protein / day.meals.length} color="bg-blue-400" />
                  <MacroBar actual={meal.totalCarbs}   target={targets.carbs   / day.meals.length} color="bg-amber-400" />
                  <MacroBar actual={meal.totalFat}     target={targets.fat     / day.meals.length} color="bg-orange-400" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Grocery view ────────────────────────────────────────────── */
function GroceryView({ list }: { list: GroceryList }) {
  const allItems = (Object.entries(list) as [keyof GroceryList, string[]][])
    .flatMap(([cat, items]) => items.map((item) => `${cat}::${item}`));

  const [checked, setChecked] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const saved = localStorage.getItem("grocery-checked");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  function toggle(key: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      localStorage.setItem("grocery-checked", JSON.stringify([...next]));
      return next;
    });
  }

  function clearChecked() {
    setChecked(new Set());
    localStorage.removeItem("grocery-checked");
  }

  const totalItems = allItems.length;
  const doneCount  = allItems.filter((k) => checked.has(k)).length;
  const pct        = totalItems > 0 ? Math.round((doneCount / totalItems) * 100) : 0;

  const categories = (Object.entries(list) as [keyof GroceryList, string[]][])
    .filter(([, items]) => items.length > 0);

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Progress header */}
      <div className="bg-white rounded-3xl card-shadow-md p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-black text-lg">
              {doneCount === totalItems && totalItems > 0
                ? "All done! 🎉"
                : `${doneCount} of ${totalItems} items`}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pct === 100 ? "Shopping complete" : "Tap items as you add them to your cart"}
            </p>
          </div>
          {doneCount > 0 && (
            <button
              onClick={clearChecked}
              className="text-xs font-semibold text-muted-foreground hover:text-destructive transition-colors px-3 py-1.5 rounded-xl hover:bg-muted"
            >
              Reset
            </button>
          )}
        </div>
        {/* Progress bar */}
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? "bg-green-500" : "gradient-orange"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Categories */}
      {categories.map(([category, items]) => {
        const cfg       = GROCERY_CONFIG[category];
        const catKeys   = items.map((item) => `${category}::${item}`);
        const catDone   = catKeys.filter((k) => checked.has(k)).length;
        const allCatDone = catDone === items.length;

        return (
          <div key={category} className="bg-white rounded-3xl card-shadow overflow-hidden">
            {/* Category header */}
            <div className="px-5 py-4 flex items-center gap-3 border-b border-muted">
              <div className={`w-3 h-3 rounded-full ${cfg.dot} shrink-0`} />
              <p className="font-black text-base">{cfg.label}</p>
              <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-xl ${
                allCatDone ? "bg-green-50 text-green-700" : "bg-muted text-muted-foreground"
              }`}>
                {catDone}/{items.length}
              </span>
            </div>

            {/* Items */}
            <div className="divide-y divide-muted">
              {items.map((item) => {
                const key       = `${category}::${item}`;
                const isDone    = checked.has(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggle(key)}
                    className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-colors active:bg-muted/60 ${
                      isDone ? "bg-muted/30" : "hover:bg-muted/20"
                    }`}
                  >
                    {/* Checkbox */}
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                      isDone
                        ? "bg-green-500 border-green-500"
                        : "border-border"
                    }`}>
                      {isDone && (
                        <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                          <path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>

                    {/* Item name */}
                    <span className={`text-sm font-medium flex-1 transition-all ${
                      isDone ? "line-through text-muted-foreground" : "text-foreground"
                    }`}>
                      {item}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export interface CurrentTargets { calories: number; protein: number; carbs: number; fat: number; goalType?: string; maintenanceCalories?: number; }

interface MealPlanViewProps {
  initialMealPlan: MealPlanData | null;
  initialTargets: CurrentTargets | null;
}

/* ─── Page ────────────────────────────────────────────────────── */
export function MealPlanView({ initialMealPlan, initialTargets }: MealPlanViewProps) {
  const { showUpgrade } = useUpgradeModal();
  const [mealPlan, setMealPlan]       = useState<MealPlanData | null>(initialMealPlan);
  const [targets, setTargets]         = useState<CurrentTargets | null>(initialTargets);
  const [generating, setGenerating]   = useState(false);
  const [view, setView]               = useState<"week" | "grocery">("week");
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

  const todayIndex = (new Date().getDay() + 6) % 7;

  async function generate() {
    if (!targets) return;
    setGenerating(true);
    const r = await fetch("/api/meal-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(targets),
    });
    const data = await r.json();
    if (!r.ok) {
      if (handleLimitReached(data, showUpgrade)) {
        setGenerating(false);
        return;
      }
    }
    if (data.mealPlan) setMealPlan(data.mealPlan);
    setGenerating(false);
  }

  // True if the stored plan was generated with different calorie targets
  const planIsStale = mealPlan && targets &&
    Math.abs(mealPlan.calories - targets.calories) > 50;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-orange px-6 pt-10 pb-16 md:pt-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-orange-200 text-sm font-medium">7-day AI-generated</p>
              <h1 className="text-3xl font-black text-white tracking-tight">Meal Plan</h1>
              {targets?.goalType && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {targets.goalType === "lose_fat" ? "🔥 Lose Fat" : targets.goalType === "build_muscle" ? "💪 Build Muscle" : "⚖️ Maintain"}
                  </span>
                  {targets.maintenanceCalories && targets.goalType !== "maintain" && (
                    <span className="text-orange-200 text-xs">
                      maintenance: {targets.maintenanceCalories.toLocaleString()} kcal
                    </span>
                  )}
                </div>
              )}
            </div>
            <Button
              onClick={generate}
              disabled={generating}
              variant="ghost"
              className="text-white hover:bg-white/20 gap-2 rounded-xl h-10"
            >
              {generating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              {mealPlan ? "Regenerate" : "Generate"}
            </Button>
          </div>

          {/* Goal calorie target — always from live profile */}
          {targets && (
            <div className="mt-6 grid grid-cols-4 gap-3">
              {[
                { label: "Daily goal", value: targets.calories, unit: "kcal", big: true },
                { label: "Protein",    value: targets.protein,  unit: "g",    big: false },
                { label: "Carbs",      value: targets.carbs,    unit: "g",    big: false },
                { label: "Fat",        value: targets.fat,      unit: "g",    big: false },
              ].map((m) => (
                <div key={m.label} className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3">
                  <p className={`font-black text-white ${m.big ? "text-2xl" : "text-xl"} leading-none`}>
                    {m.value}<span className="text-sm font-semibold text-orange-200 ml-0.5">{m.unit}</span>
                  </p>
                  <p className="text-orange-200 text-xs mt-1">{m.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {!mealPlan ? (
        /* Empty state */
        <div className="max-w-lg mx-auto px-6 -mt-6 pb-10">
          <div className="bg-white rounded-3xl card-shadow-md p-10 text-center space-y-5">
            {generating ? (
              <>
                <Loader2 size={40} className="text-primary animate-spin mx-auto" />
                <p className="font-black text-xl">Building your 7-day plan…</p>
                <p className="text-sm text-muted-foreground">GPT-4o is crafting meals to hit your exact macros. Takes ~15 seconds.</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto">
                  <CalendarDays size={28} className="text-primary" />
                </div>
                <p className="font-black text-xl">No plan yet</p>
                <p className="text-sm text-muted-foreground">
                  Generate your AI-powered 7-day meal plan tailored to your macro targets and food preferences.
                </p>
                <Button onClick={generate} className="gradient-orange border-0 hover:opacity-90 h-12 px-8 rounded-2xl font-bold w-full">
                  Generate my meal plan →
                </Button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 -mt-4 pb-12 space-y-5">

          {/* Stale plan warning */}
          {planIsStale && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-amber-500 text-lg">⚠️</span>
                <div>
                  <p className="font-bold text-sm text-amber-800">This plan was built for {mealPlan!.calories} kcal/day</p>
                  <p className="text-xs text-amber-700 mt-0.5">Your current goal is {targets!.calories} kcal/day — regenerate to sync.</p>
                </div>
              </div>
              <Button onClick={generate} disabled={generating} size="sm" className="gradient-orange border-0 rounded-xl shrink-0 hover:opacity-90">
                {generating ? <Loader2 size={14} className="animate-spin" /> : "Regenerate"}
              </Button>
            </div>
          )}

          {/* View toggle */}
          <div className="flex gap-1.5 p-1 bg-muted rounded-2xl w-fit">
              {[
                { id: "week",    label: "Week view",     icon: CalendarDays },
                { id: "grocery", label: "Grocery list",  icon: ShoppingCart },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setView(id as "week" | "grocery")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                    view === id ? "bg-white card-shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon size={15} />{label}
                </button>
              ))}
          </div>

          {view === "week" && (
            <>
              {/* Tap hint */}
              <p className="text-xs text-muted-foreground text-center">Tap any meal to see full details</p>

              {/* 7-day grid — horizontal scroll on mobile, 7-col on desktop */}
              <div className="overflow-x-auto pb-2 -mx-4 px-4">
                <div className="grid grid-cols-7 gap-3 min-w-[980px]">
                  {mealPlan.days.map((day, i) => (
                    <DayCard
                      key={day.day}
                      day={day}
                      dayIndex={i}
                      targets={targets ?? mealPlan}
                      isToday={i === todayIndex}
                      onMealClick={setSelectedMeal}
                    />
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 justify-center pt-1">
                {Object.entries(MEAL_COLORS).map(([name, c]) => (
                  <div key={name} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${c.dot}`} />
                    <span className="text-xs text-muted-foreground">{name}</span>
                  </div>
                ))}
                <div className="flex items-center gap-1.5">
                  <div className="w-8 h-3 rounded-full ring-2 ring-primary" />
                  <span className="text-xs text-muted-foreground">Today</span>
                </div>
              </div>
            </>
          )}

          {view === "grocery" && mealPlan.groceryList && (
            <GroceryView list={mealPlan.groceryList} />
          )}
        </div>
      )}

      {/* Meal detail overlay */}
      {selectedMeal && (
        <MealDetail meal={selectedMeal} onClose={() => setSelectedMeal(null)} />
      )}
    </div>
  );
}
