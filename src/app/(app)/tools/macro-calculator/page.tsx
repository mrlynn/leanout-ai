"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Flame, Beef, Wheat, Droplets } from "lucide-react";

type Sex = "male" | "female";
type HeightUnit = "imperial" | "metric";
type WeightUnit = "lbs" | "kg";
type Goal = "maintain" | "lose" | "gain";
type ActivityLevel = "sedentary" | "lightly" | "moderately" | "very" | "extra";

const GOALS: { value: Goal; label: string }[] = [
  { value: "maintain", label: "Maintain Current Weight" },
  { value: "lose", label: "Lose Weight" },
  { value: "gain", label: "Gain Weight" },
];

const ACTIVITIES: { value: ActivityLevel; label: string; multiplier: number }[] = [
  { value: "sedentary", label: "Sedentary", multiplier: 1.2 },
  { value: "lightly", label: "Lightly Active", multiplier: 1.375 },
  { value: "moderately", label: "Moderately Active", multiplier: 1.55 },
  { value: "very", label: "Very Active", multiplier: 1.725 },
  { value: "extra", label: "Extra Active", multiplier: 1.9 },
];

const GOAL_CALORIE_DELTA: Record<Goal, number> = {
  maintain: 0,
  lose: -500,
  gain: 300,
};

// Macro ratios by goal
const MACRO_RATIOS: Record<Goal, { protein: number; carbs: number; fat: number }> = {
  maintain: { protein: 0.3, carbs: 0.4, fat: 0.3 },
  lose: { protein: 0.35, carbs: 0.35, fat: 0.3 },
  gain: { protein: 0.3, carbs: 0.45, fat: 0.25 },
};

function calcBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: Sex
): number {
  // Mifflin-St Jeor
  return sex === "male"
    ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
}

interface Results {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

function ToggleGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`py-2.5 px-3 rounded-xl text-sm font-semibold transition-all border ${
            value === opt.value
              ? "bg-primary text-white border-primary shadow-sm"
              : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function SelectGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`w-full text-left py-3 px-4 rounded-xl text-sm font-semibold transition-all border ${
            value === opt.value
              ? "bg-primary text-white border-primary shadow-sm"
              : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-base font-bold text-foreground mb-2">{children}</p>;
}

export default function MacroCalculatorPage() {
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<Sex>("male");
  const [heightUnit, setHeightUnit] = useState<HeightUnit>("imperial");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [heightM, setHeightM] = useState("");
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("lbs");
  const [weight, setWeight] = useState("");
  const [goal, setGoal] = useState<Goal>("lose");
  const [activity, setActivity] = useState<ActivityLevel>("very");
  const [results, setResults] = useState<Results | null>(null);

  function calculate() {
    const ageNum = Number(age);
    const weightKg =
      weightUnit === "lbs" ? Number(weight) * 0.453592 : Number(weight);
    const heightCm =
      heightUnit === "imperial"
        ? (Number(heightFt) * 12 + (Number(heightIn) || 0)) * 2.54
        : Number(heightM) * 100;

    if (!ageNum || !weightKg || !heightCm) return;

    const bmr = calcBMR(weightKg, heightCm, ageNum, sex);
    const activityMultiplier = ACTIVITIES.find((a) => a.value === activity)!.multiplier;
    const tdee = bmr * activityMultiplier;
    const calories = Math.round(tdee + GOAL_CALORIE_DELTA[goal]);

    const ratios = MACRO_RATIOS[goal];
    const proteinG = Math.round((calories * ratios.protein) / 4);
    const carbsG = Math.round((calories * ratios.carbs) / 4);
    const fatG = Math.round((calories * ratios.fat) / 9);

    setResults({ calories, proteinG, carbsG, fatG });
  }

  const canCalculate =
    age !== "" &&
    weight !== "" &&
    (heightUnit === "imperial" ? heightFt !== "" : heightM !== "");

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center">
          <Beef className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Macro Calculator</h1>
          <p className="text-sm text-muted-foreground">
            Find your ideal daily protein, carbs, and fat targets.
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
        {/* Age */}
        <div>
          <SectionLabel>Age</SectionLabel>
          <Input
            type="number"
            min={1}
            max={120}
            placeholder="e.g. 35"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
        </div>

        {/* Sex */}
        <div>
          <SectionLabel>Sex</SectionLabel>
          <ToggleGroup
            value={sex}
            onChange={setSex}
            options={[
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
            ]}
          />
        </div>

        {/* Height */}
        <div>
          <SectionLabel>Height</SectionLabel>
          <ToggleGroup
            value={heightUnit}
            onChange={setHeightUnit}
            options={[
              { value: "imperial", label: "Feet" },
              { value: "metric", label: "Meters" },
            ]}
          />
          <div className="mt-2">
            {heightUnit === "imperial" ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <Input
                    type="number"
                    min={0}
                    max={8}
                    placeholder="Feet"
                    value={heightFt}
                    onChange={(e) => setHeightFt(e.target.value)}
                    className="pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">ft</span>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    min={0}
                    max={11}
                    placeholder="Inches"
                    value={heightIn}
                    onChange={(e) => setHeightIn(e.target.value)}
                    className="pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">in</span>
                </div>
              </div>
            ) : (
              <div className="relative">
                <Input
                  type="number"
                  min={0.5}
                  max={3}
                  step={0.01}
                  placeholder="e.g. 1.78"
                  value={heightM}
                  onChange={(e) => setHeightM(e.target.value)}
                  className="pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">m</span>
              </div>
            )}
          </div>
        </div>

        {/* Weight */}
        <div>
          <SectionLabel>Weight</SectionLabel>
          <ToggleGroup
            value={weightUnit}
            onChange={setWeightUnit}
            options={[
              { value: "lbs", label: "Pounds" },
              { value: "kg", label: "Kilograms" },
            ]}
          />
          <div className="mt-2 relative">
            <Input
              type="number"
              min={1}
              placeholder={weightUnit === "lbs" ? "e.g. 178" : "e.g. 80"}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="pr-14"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {weightUnit}
            </span>
          </div>
        </div>

        {/* Goal */}
        <div>
          <SectionLabel>Goal</SectionLabel>
          <SelectGroup value={goal} onChange={setGoal} options={GOALS} />
        </div>

        {/* Activity */}
        <div>
          <SectionLabel>Activity Level</SectionLabel>
          <SelectGroup value={activity} onChange={setActivity} options={ACTIVITIES} />
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={calculate}
          disabled={!canCalculate}
        >
          Calculate
        </Button>
      </div>

      {/* Results */}
      {results && (
        <div className="mt-6 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-lg font-bold">Your Daily Targets</h2>

          {/* Calories */}
          <div className="gradient-orange rounded-xl p-4 text-white text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Flame className="w-5 h-5" />
              <span className="text-sm font-semibold uppercase tracking-wide">Calories</span>
            </div>
            <div className="text-5xl font-black">{results.calories.toLocaleString()}</div>
            <div className="text-sm opacity-80 mt-1">kcal / day</div>
          </div>

          {/* Macros */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Beef className="w-4 h-4 text-red-500" />
                <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">Protein</span>
              </div>
              <div className="text-3xl font-black text-red-600">{results.proteinG}</div>
              <div className="text-xs text-red-400 mt-0.5">grams</div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Wheat className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Carbs</span>
              </div>
              <div className="text-3xl font-black text-amber-600">{results.carbsG}</div>
              <div className="text-xs text-amber-400 mt-0.5">grams</div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Droplets className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Fat</span>
              </div>
              <div className="text-3xl font-black text-blue-600">{results.fatG}</div>
              <div className="text-xs text-blue-400 mt-0.5">grams</div>
            </div>
          </div>

          {/* Macro bar */}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Protein {Math.round((results.proteinG * 4 / results.calories) * 100)}%</span>
              <span>Carbs {Math.round((results.carbsG * 4 / results.calories) * 100)}%</span>
              <span>Fat {Math.round((results.fatG * 9 / results.calories) * 100)}%</span>
            </div>
            <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
              <div
                className="bg-red-400 rounded-l-full"
                style={{ width: `${(results.proteinG * 4 / results.calories) * 100}%` }}
              />
              <div
                className="bg-amber-400"
                style={{ width: `${(results.carbsG * 4 / results.calories) * 100}%` }}
              />
              <div
                className="bg-blue-400 rounded-r-full flex-1"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            These are estimates based on the Mifflin-St Jeor equation. Adjust based on your progress and how you feel.
          </p>
        </div>
      )}
    </div>
  );
}
