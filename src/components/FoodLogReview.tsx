"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, X } from "lucide-react";
import type { FoodItem, FoodSource, MealType } from "@/lib/foodLog";
import { sumFoods } from "@/lib/foodLog";

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
];

export interface ReviewState {
  mealType: MealType;
  source: FoodSource;
  foods: FoodItem[];
  notes: string;
}

interface FoodLogReviewProps {
  state: ReviewState;
  onChange: (state: ReviewState) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  confidence?: string;
  aiNotes?: string;
}

function emptyFood(): FoodItem {
  return { name: "", quantity: "", calories: 0, protein: 0, carbs: 0, fat: 0 };
}

export function FoodLogReview({
  state,
  onChange,
  onSave,
  onCancel,
  saving,
  confidence,
  aiNotes,
}: FoodLogReviewProps) {
  const totals = sumFoods(state.foods);

  function updateFood(index: number, field: keyof FoodItem, value: string | number) {
    const foods = [...state.foods];
    foods[index] = { ...foods[index], [field]: value };
    onChange({ ...state, foods });
  }

  function removeFood(index: number) {
    if (state.foods.length <= 1) return;
    onChange({ ...state, foods: state.foods.filter((_, i) => i !== index) });
  }

  function addFood() {
    onChange({ ...state, foods: [...state.foods, emptyFood()] });
  }

  const canSave = state.foods.every((f) => f.name.trim().length > 0);

  return (
    <div className="bg-white rounded-3xl card-shadow-md overflow-hidden">
      <div className="gradient-orange-soft px-6 py-4 flex items-center justify-between">
        <p className="font-black text-lg">Review &amp; save</p>
        <button type="button" onClick={onCancel} className="p-1.5 rounded-xl hover:bg-black/10 transition-colors">
          <X size={18} />
        </button>
      </div>

      {(confidence || aiNotes) && (
        <div className="px-6 py-3 bg-amber-50 border-b border-amber-100 text-sm text-amber-800">
          {confidence && <p className="font-semibold">AI confidence: {confidence}</p>}
          {aiNotes && <p className="text-xs mt-0.5">{aiNotes}</p>}
        </div>
      )}

      <div className="px-6 py-4 space-y-4">
        <div>
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Meal type</Label>
          <div className="flex gap-2 mt-2 flex-wrap">
            {MEAL_TYPES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => onChange({ ...state, mealType: value })}
                className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${
                  state.mealType === value
                    ? "gradient-orange text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Foods</Label>
          {state.foods.map((food, i) => (
            <div key={i} className="p-4 rounded-2xl bg-muted/40 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Input
                  placeholder="Food name"
                  value={food.name}
                  onChange={(e) => updateFood(i, "name", e.target.value)}
                  className="font-semibold"
                />
                {state.foods.length > 1 && (
                  <button type="button" onClick={() => removeFood(i)} className="p-1.5 text-muted-foreground hover:text-destructive">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <Input
                placeholder="Quantity (e.g. 6 oz)"
                value={food.quantity}
                onChange={(e) => updateFood(i, "quantity", e.target.value)}
              />
              <div className="grid grid-cols-4 gap-2">
                {(["calories", "protein", "carbs", "fat"] as const).map((field) => (
                  <div key={field}>
                    <Label className="text-xs text-muted-foreground capitalize">{field === "calories" ? "kcal" : `${field}g`}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={food[field] || ""}
                      onChange={(e) => updateFood(i, field, Number(e.target.value) || 0)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addFood} className="w-full">
            <Plus size={14} className="mr-1" /> Add food
          </Button>
        </div>

        <div>
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Notes (optional)</Label>
          <Textarea
            className="mt-2"
            value={state.notes}
            onChange={(e) => onChange({ ...state, notes: e.target.value })}
            placeholder="Any notes about this meal..."
            rows={2}
          />
        </div>

        <div className="grid grid-cols-4 gap-2 py-3 border-t border-muted">
          {[
            { label: "Calories", value: totals.calories, unit: "" },
            { label: "Protein", value: totals.protein, unit: "g" },
            { label: "Carbs", value: totals.carbs, unit: "g" },
            { label: "Fat", value: totals.fat, unit: "g" },
          ].map((m) => (
            <div key={m.label} className="text-center">
              <p className="text-base font-black">{m.value}{m.unit}</p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" className="flex-1 gradient-orange text-white border-0" onClick={onSave} disabled={saving || !canSave}>
            {saving ? "Saving..." : "Save to log"}
          </Button>
        </div>
      </div>
    </div>
  );
}
