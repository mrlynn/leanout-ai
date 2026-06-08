"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronRight, ChevronLeft, Calculator } from "lucide-react";

type Sex = "male" | "female";
type ActivityLevel = "inactive" | "somewhat" | "active" | "very_active";

const ACTIVITY = [
  {
    value: "inactive" as ActivityLevel,
    label: "Inactive",
    desc: "Never or rarely include physical activity in your day.",
    multiplier: 1.2,
  },
  {
    value: "somewhat" as ActivityLevel,
    label: "Somewhat active",
    desc: "Include light activity or moderate activity about two to three times a week.",
    multiplier: 1.375,
  },
  {
    value: "active" as ActivityLevel,
    label: "Active",
    desc: "Include at least 30 minutes of moderate activity most days of the week, or 20 minutes of vigorous activity at least three days a week.",
    multiplier: 1.55,
  },
  {
    value: "very_active" as ActivityLevel,
    label: "Very active",
    desc: "Include large amounts of moderate or vigorous activity in your day.",
    multiplier: 1.725,
  },
];

function harrisBenedict(
  weightLbs: number,
  heightFt: number,
  heightIn: number,
  age: number,
  sex: Sex
): number {
  const totalInches = heightFt * 12 + heightIn;
  return sex === "male"
    ? 66 + 6.2 * weightLbs + 12.7 * totalInches - 6.76 * age
    : 655.1 + 4.35 * weightLbs + 4.7 * totalInches - 4.7 * age;
}

function round50(n: number): number {
  return Math.round(n / 50) * 50;
}

export default function CalorieCalculatorPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [age, setAge] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [weight, setWeight] = useState("");
  const [sex, setSex] = useState<Sex | null>(null);
  const [activity, setActivity] = useState<ActivityLevel | null>(null);

  const step1Valid =
    age !== "" && heightFt !== "" && weight !== "" && sex !== null &&
    Number(age) > 0 && Number(heightFt) > 0 && Number(weight) > 0;

  const step2Valid = activity !== null;

  const bmr = step1Valid
    ? harrisBenedict(Number(weight), Number(heightFt), Number(heightIn) || 0, Number(age), sex!)
    : 0;

  const selectedCalories = activity
    ? round50(bmr * ACTIVITY.find((a) => a.value === activity)!.multiplier)
    : 0;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Calculator className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Calorie Calculator</h1>
          <p className="text-sm text-muted-foreground">
            Estimate the number of daily calories your body needs to maintain your current weight.
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="age">Age</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="age"
                    type="number"
                    min={1}
                    max={120}
                    placeholder="0"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">years</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Height</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={8}
                    placeholder="0"
                    value={heightFt}
                    onChange={(e) => setHeightFt(e.target.value)}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">ft.</span>
                  <Input
                    type="number"
                    min={0}
                    max={11}
                    placeholder="0"
                    value={heightIn}
                    onChange={(e) => setHeightIn(e.target.value)}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">in.</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="weight">Weight</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="weight"
                    type="number"
                    min={1}
                    placeholder="0"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">lbs.</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Sex</Label>
                <div className="flex gap-4 pt-1">
                  {(["male", "female"] as Sex[]).map((s) => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="sex"
                        checked={sex === s}
                        onChange={() => setSex(s)}
                        className="accent-primary w-4 h-4"
                      />
                      <span className="text-sm capitalize">{s}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setStep(2)} disabled={!step1Valid}>
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-5">
            <p className="font-semibold text-primary">
              Select the statement that best describes your usual activity level:
            </p>
            <div className="space-y-3">
              {ACTIVITY.map((a) => (
                <label key={a.value} className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="activity"
                    checked={activity === a.value}
                    onChange={() => setActivity(a.value)}
                    className="accent-primary w-4 h-4 mt-0.5 shrink-0"
                  />
                  <span className="text-sm">
                    <span className="font-semibold">{a.label}:</span> {a.desc}
                  </span>
                </label>
              ))}
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button onClick={() => setStep(3)} disabled={!step2Valid}>
                Calculate
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 — Results */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <p className="font-semibold text-foreground">
                Your estimated daily calorie needs (rounded to the nearest 50 calories) are:
              </p>
              <p className="text-5xl font-black text-primary mt-2">
                {selectedCalories.toLocaleString()}{" "}
                <span className="text-2xl font-semibold text-muted-foreground">calories</span>
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-3">
                See how your daily calorie needs change if you alter your activity level:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {ACTIVITY.map((a) => {
                  const cals = round50(bmr * a.multiplier);
                  const isSelected = a.value === activity;
                  return (
                    <button
                      key={a.value}
                      onClick={() => setActivity(a.value)}
                      className={`rounded-xl p-3 text-center border transition-all ${
                        isSelected
                          ? "bg-primary text-white border-primary shadow-md"
                          : "bg-muted/40 text-muted-foreground border-border hover:border-primary/40"
                      }`}
                    >
                      <div className={`text-2xl font-bold ${isSelected ? "text-white" : ""}`}>
                        {cals.toLocaleString()}
                      </div>
                      <div className={`text-xs mt-0.5 ${isSelected ? "text-white/80" : ""}`}>
                        calories
                      </div>
                      <div className={`text-xs mt-1 font-medium ${isSelected ? "text-white/90" : ""}`}>
                        {a.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              People judge the intensity of their activities differently. And activity levels can change
              over time. So think of your calorie estimate as a starting point and adjust it up or down
              as you alter your activity level.
            </div>

            <div className="flex justify-between items-center pt-1">
              <p className="text-xs text-muted-foreground">
                Based on the Harris Benedict Equation and Institute of Medicine Dietary Reference Intakes.
              </p>
              <Button variant="outline" onClick={() => { setStep(1); setActivity(null); }}>
                Recalculate
              </Button>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        If you&apos;re pregnant or breast-feeding, are a competitive athlete, or have a metabolic disease
        such as diabetes, the calorie calculator may overestimate or underestimate your actual calorie needs.
      </p>
    </div>
  );
}
