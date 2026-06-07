"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Camera,
  ClipboardList,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { FoodLogReview, type ReviewState } from "@/components/FoodLogReview";
import { resizeImageToDataUrl } from "@/lib/imageResize";
import {
  getDateString,
  getDayNameFromStartDate,
  inferMealTypeFromName,
  mealPlanFoodToFoodItem,
  sumFoods,
  type FoodItem,
  type FoodSource,
  type MacroTotals,
  type MealType,
} from "@/lib/foodLog";

interface Macros {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

interface FoodLogEntry {
  _id: string;
  date: string;
  mealType: MealType;
  source: FoodSource;
  foods: FoodItem[];
  notes?: string;
  createdAt: string;
}

interface MealPlanFood {
  item: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealPlanMeal {
  name: string;
  foods: MealPlanFood[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

interface MealPlanDay {
  day: string;
  meals: MealPlanMeal[];
}

interface MealPlanData {
  startDate: string;
  days: MealPlanDay[];
}

type Tab = "photo" | "manual" | "plan";

const PREFILL_KEY = "food-log-prefill";

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

function MacroBar({ actual, target, color }: { actual: number; target: number; color: string }) {
  const pct = target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0;
  return (
    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function emptyManualFood(): FoodItem {
  return { name: "", quantity: "1 serving", calories: 0, protein: 0, carbs: 0, fat: 0 };
}

export default function FoodLogPage() {
  const today = getDateString();
  const fileRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<Tab>("photo");
  const [macros, setMacros] = useState<Macros | null>(null);
  const [entries, setEntries] = useState<FoodLogEntry[]>([]);
  const [totals, setTotals] = useState<MacroTotals>({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [loading, setLoading] = useState(true);
  const [recognizing, setRecognizing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [review, setReview] = useState<ReviewState | null>(null);
  const [confidence, setConfidence] = useState<string>();
  const [aiNotes, setAiNotes] = useState<string>();
  const [editingId, setEditingId] = useState<string | null>(null);

  const [manualFood, setManualFood] = useState<FoodItem>(emptyManualFood());
  const [manualMealType, setManualMealType] = useState<MealType>("lunch");

  const [mealPlan, setMealPlan] = useState<MealPlanData | null>(null);
  const [todayMeals, setTodayMeals] = useState<MealPlanMeal[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [macrosRes, logRes, planRes] = await Promise.all([
        fetch("/api/user/macros"),
        fetch(`/api/food-log?date=${today}`),
        fetch("/api/meal-plan"),
      ]);

      if (macrosRes.ok) setMacros(await macrosRes.json());

      if (logRes.ok) {
        const data = await logRes.json();
        setEntries(data.entries);
        setTotals(data.totals);
      }

      if (planRes.ok) {
        const { mealPlan: plan } = await planRes.json();
        if (plan?.days) {
          setMealPlan(plan);
          const dayName = getDayNameFromStartDate(plan.startDate);
          const day = plan.days.find((d: MealPlanDay) => d.day === dayName);
          setTodayMeals(day?.meals ?? []);
        }
      }
    } catch {
      setError("Failed to load food log");
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const raw = sessionStorage.getItem(PREFILL_KEY);
    if (!raw) return;
    sessionStorage.removeItem(PREFILL_KEY);
    try {
      const prefill = JSON.parse(raw) as {
        mealName: string;
        foods: MealPlanFood[];
        source: FoodSource;
      };
      setReview({
        mealType: inferMealTypeFromName(prefill.mealName),
        source: prefill.source,
        foods: prefill.foods.map(mealPlanFoodToFoodItem),
        notes: "",
      });
      setTab("plan");
    } catch {
      /* ignore bad prefill */
    }
  }, []);

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setRecognizing(true);
    setError("");
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      const res = await fetch("/api/food-log/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Recognition failed");

      const mealType = (["breakfast", "lunch", "dinner", "snack"].includes(data.mealType)
        ? data.mealType
        : "snack") as MealType;

      setReview({
        mealType,
        source: "vision",
        foods: data.foods,
        notes: "",
      });
      setConfidence(data.confidence);
      setAiNotes(data.notes);
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recognition failed");
    } finally {
      setRecognizing(false);
    }
  }

  function startManualReview() {
    if (!manualFood.name.trim()) {
      setError("Enter a food name");
      return;
    }
    setReview({
      mealType: manualMealType,
      source: "manual",
      foods: [manualFood],
      notes: "",
    });
    setConfidence(undefined);
    setAiNotes(undefined);
    setEditingId(null);
    setError("");
  }

  function startPlanReview(meal: MealPlanMeal) {
    setReview({
      mealType: inferMealTypeFromName(meal.name),
      source: "meal_plan",
      foods: meal.foods.map(mealPlanFoodToFoodItem),
      notes: "",
    });
    setConfidence(undefined);
    setAiNotes(undefined);
    setEditingId(null);
  }

  function startEdit(entry: FoodLogEntry) {
    setReview({
      mealType: entry.mealType,
      source: entry.source,
      foods: [...entry.foods],
      notes: entry.notes ?? "",
    });
    setEditingId(entry._id);
    setConfidence(undefined);
    setAiNotes(undefined);
  }

  function cancelReview() {
    setReview(null);
    setEditingId(null);
    setConfidence(undefined);
    setAiNotes(undefined);
    setManualFood(emptyManualFood());
  }

  async function saveReview() {
    if (!review) return;
    setSaving(true);
    setError("");
    try {
      const body = {
        date: today,
        mealType: review.mealType,
        source: review.source,
        foods: review.foods,
        notes: review.notes || undefined,
      };

      const res = editingId
        ? await fetch("/api/food-log", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: editingId, ...body }),
          })
        : await fetch("/api/food-log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");

      setTotals(data.totals);
      await loadData();
      cancelReview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry(id: string) {
    if (!confirm("Delete this log entry?")) return;
    setError("");
    try {
      const res = await fetch(`/api/food-log?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      setTotals(data.totals);
      setEntries((prev) => prev.filter((e) => e._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-orange px-6 pt-10 pb-14 md:pt-12">
        <div className="max-w-2xl mx-auto">
          <p className="text-orange-200 text-sm font-medium mb-1">Track intake</p>
          <h1 className="text-3xl font-black text-white tracking-tight">Food Log</h1>
          <p className="text-orange-200 text-sm mt-1">{today}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 -mt-8 pb-10 space-y-5">
        {error && (
          <div className="bg-red-50 text-red-700 text-sm font-medium px-4 py-3 rounded-2xl border border-red-100">
            {error}
          </div>
        )}

        {/* Daily summary */}
        <div className="bg-white rounded-3xl card-shadow-md p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Today&apos;s intake</p>
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-sm font-bold">Calories</span>
                  <span className="text-sm">
                    <span className="font-black text-lg">{totals.calories}</span>
                    {macros && <span className="text-muted-foreground"> / {macros.calories}</span>}
                  </span>
                </div>
                <MacroBar actual={totals.calories} target={macros?.calories ?? 0} color="bg-orange-500" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Protein", actual: totals.protein, target: macros?.proteinG ?? 0, color: "bg-blue-500", text: "text-blue-600" },
                  { label: "Carbs", actual: totals.carbs, target: macros?.carbsG ?? 0, color: "bg-amber-400", text: "text-amber-600" },
                  { label: "Fat", actual: totals.fat, target: macros?.fatG ?? 0, color: "bg-orange-500", text: "text-orange-600" },
                ].map((m) => (
                  <div key={m.label}>
                    <p className={`text-xs font-bold ${m.text}`}>{m.label}</p>
                    <p className="text-lg font-black">
                      {m.actual}<span className="text-xs font-medium text-muted-foreground">g</span>
                      {macros && <span className="text-xs text-muted-foreground"> / {m.target}g</span>}
                    </p>
                    <MacroBar actual={m.actual} target={m.target} color={m.color} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Review overlay */}
        {review ? (
          <FoodLogReview
            state={review}
            onChange={setReview}
            onSave={saveReview}
            onCancel={cancelReview}
            saving={saving}
            confidence={confidence}
            aiNotes={aiNotes}
          />
        ) : (
          <>
            {/* Add food tabs */}
            <div className="bg-white rounded-3xl card-shadow p-6 space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Add food</p>
              <div className="flex gap-2">
                {([
                  { id: "photo" as Tab, label: "Photo", icon: Camera },
                  { id: "manual" as Tab, label: "Manual", icon: Pencil },
                  { id: "plan" as Tab, label: "From plan", icon: UtensilsCrossed },
                ]).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTab(id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      tab === id ? "gradient-orange text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>

              {tab === "photo" && (
                <div className="text-center py-4">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                  <Button
                    type="button"
                    className="gradient-orange text-white border-0 w-full"
                    onClick={() => fileRef.current?.click()}
                    disabled={recognizing}
                  >
                    {recognizing ? (
                      <><Loader2 size={16} className="animate-spin mr-2" /> Analyzing...</>
                    ) : (
                      <><Camera size={16} className="mr-2" /> Take or upload photo</>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">AI estimates macros — review before saving</p>
                </div>
              )}

              {tab === "manual" && (
                <div className="space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    {(["breakfast", "lunch", "dinner", "snack"] as MealType[]).map((mt) => (
                      <button
                        key={mt}
                        type="button"
                        onClick={() => setManualMealType(mt)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold ${
                          manualMealType === mt ? "bg-orange-100 text-orange-700" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {MEAL_LABELS[mt]}
                      </button>
                    ))}
                  </div>
                  <div>
                    <Label>Food name</Label>
                    <Input
                      className="mt-1"
                      value={manualFood.name}
                      onChange={(e) => setManualFood({ ...manualFood, name: e.target.value })}
                      placeholder="e.g. Grilled chicken breast"
                    />
                  </div>
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      className="mt-1"
                      value={manualFood.quantity}
                      onChange={(e) => setManualFood({ ...manualFood, quantity: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {(["calories", "protein", "carbs", "fat"] as const).map((field) => (
                      <div key={field}>
                        <Label className="text-xs">{field === "calories" ? "kcal" : `${field}g`}</Label>
                        <Input
                          type="number"
                          min={0}
                          value={manualFood[field] || ""}
                          onChange={(e) => setManualFood({ ...manualFood, [field]: Number(e.target.value) || 0 })}
                        />
                      </div>
                    ))}
                  </div>
                  <Button type="button" className="w-full gradient-orange text-white border-0" onClick={startManualReview}>
                    <Plus size={14} className="mr-1" /> Continue to review
                  </Button>
                </div>
              )}

              {tab === "plan" && (
                <div className="space-y-2">
                  {!mealPlan ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No meal plan yet. <a href="/meal-plan" className="text-primary font-semibold">Generate one</a>
                    </p>
                  ) : todayMeals.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No meals found for today in your plan.</p>
                  ) : (
                    todayMeals.map((meal, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => startPlanReview(meal)}
                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-muted/40 hover:bg-muted/70 transition-colors text-left"
                      >
                        <div>
                          <p className="font-bold text-sm">{meal.name}</p>
                          <p className="text-xs text-muted-foreground">{meal.foods.length} items · {meal.totalCalories} kcal</p>
                        </div>
                        <Plus size={16} className="text-primary shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Today's entries */}
        <div className="bg-white rounded-3xl card-shadow p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Today&apos;s log</p>
          {entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No food logged yet today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => {
                const entryTotals = sumFoods(entry.foods);
                return (
                  <div key={entry._id} className="p-4 rounded-2xl bg-muted/30">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-sm">{MEAL_LABELS[entry.mealType]}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {entry.foods.map((f) => f.name).join(", ")}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black">{entryTotals.calories} kcal</p>
                        <p className="text-xs text-muted-foreground">
                          {entryTotals.protein}P · {entryTotals.carbs}C · {entryTotals.fat}F
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button type="button" variant="outline" size="sm" onClick={() => startEdit(entry)} disabled={!!review}>
                        <Pencil size={12} className="mr-1" /> Edit
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => deleteEntry(entry._id)} disabled={!!review}>
                        <Trash2 size={12} className="mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
