"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { calculatePhysique, calculateMacros } from "@/lib/calculator";
import type { ActivityLevel } from "@/lib/calculator";
import { ChevronRight, ChevronLeft, Zap, Loader2 } from "lucide-react";

type Step = "basics" | "goals" | "lifestyle" | "results";
const STEPS: Step[] = ["basics", "goals", "lifestyle", "results"];

function fmtDate(d?: Date | string) {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
}

function inchesToFtIn(inches?: number) {
  if (!inches) return { ft: "", in: "" };
  return { ft: String(Math.floor(inches / 12)), in: String(inches % 12) };
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("basics");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    age: "", sex: "", heightFt: "", heightIn: "", weightLbs: "", bodyFatPercent: "",
    activityLevel: "", trainingFrequency: "", goalType: "", goalBodyFatPercent: "",
    goalDate: "", vacationDate: "", foodPreferences: "", allergies: "", supplements: "",
    onTRT: false,
  });

  useEffect(() => {
    fetch("/api/user/me")
      .then((r) => r.json())
      .then(({ user }) => {
        if (!user) return;
        const { ft, in: inches } = inchesToFtIn(user.heightInches);
        setForm({
          age: user.age ? String(user.age) : "",
          sex: user.sex ?? "",
          heightFt: ft,
          heightIn: inches,
          weightLbs: user.weightLbs ? String(user.weightLbs) : "",
          bodyFatPercent: user.bodyFatPercent ? String(user.bodyFatPercent) : "",
          activityLevel: user.activityLevel ?? "",
          trainingFrequency: user.trainingFrequency ? String(user.trainingFrequency) : "",
          goalType: user.goalType ?? "",
          goalBodyFatPercent: "", // not stored separately — leave blank for re-entry
          goalDate: fmtDate(user.goalDate),
          vacationDate: fmtDate(user.vacationDate),
          foodPreferences: user.foodPreferences ?? "",
          allergies: user.allergies ?? "",
          supplements: user.supplements ?? "",
          onTRT: user.onTRT ?? false,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  function set(field: string, value: string | boolean | null) {
    setForm((p) => ({ ...p, [field]: value ?? "" }));
  }

  const heightInches = parseInt(form.heightFt || "0") * 12 + parseInt(form.heightIn || "0");
  const stepIndex = STEPS.indexOf(step);

  const physiqueResult =
    step === "results" && form.weightLbs && form.bodyFatPercent && form.activityLevel && form.goalType
      ? calculatePhysique({
          weightLbs: parseFloat(form.weightLbs),
          bodyFatPercent: parseFloat(form.bodyFatPercent),
          heightInches,
          age: parseInt(form.age),
          sex: form.sex as "male" | "female",
          activityLevel: form.activityLevel as ActivityLevel,
          goalType: form.goalType as "lose_fat" | "maintain" | "build_muscle",
          goalBodyFatPercent: form.goalBodyFatPercent ? parseFloat(form.goalBodyFatPercent) : undefined,
        })
      : null;

  const macros = physiqueResult ? calculateMacros(physiqueResult.targetCalories, physiqueResult.leanBodyMassLbs) : null;

  async function saveAndFinish() {
    setSaving(true);
    await fetch("/api/user/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        age: parseInt(form.age), sex: form.sex, heightInches,
        weightLbs: parseFloat(form.weightLbs), bodyFatPercent: parseFloat(form.bodyFatPercent),
        activityLevel: form.activityLevel, trainingFrequency: parseInt(form.trainingFrequency),
        goalType: form.goalType,
        goalBodyFatPercent: form.goalBodyFatPercent ? parseFloat(form.goalBodyFatPercent) : undefined,
        goalDate: form.goalDate || undefined,
        vacationDate: form.vacationDate || undefined, foodPreferences: form.foodPreferences,
        allergies: form.allergies, supplements: form.supplements, onTRT: form.onTRT,
      }),
    });
    router.push("/dashboard");
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={28} />
    </div>
  );

  const stepTitles = { basics: "Your body stats", goals: "Your goal", lifestyle: "Lifestyle", results: "Your plan" };
  const stepSubs = {
    basics: "We need this to calculate your targets.",
    goals: "What are you working toward?",
    lifestyle: "Helps us tailor everything.",
    results: "Based on your stats and goal.",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-orange px-6 pt-10 pb-16 md:pt-12">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
              <Zap size={14} className="text-white" fill="white" />
            </div>
            <span className="font-black text-white text-lg">LeanOut AI</span>
          </div>
          <p className="text-orange-200 text-sm font-medium">Step {stepIndex + 1} of {STEPS.length}</p>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">{stepTitles[step]}</h1>
          <p className="text-orange-200 text-sm mt-1">{stepSubs[step]}</p>

          {/* Progress bar */}
          <div className="flex gap-1.5 mt-6">
            {STEPS.map((s, i) => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-all ${i <= stepIndex ? "bg-white" : "bg-white/25"}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 -mt-6 pb-10">
        <div className="bg-white rounded-3xl card-shadow-md p-6 space-y-5">

          {step === "basics" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">Age</Label>
                  <Input type="number" placeholder="30" value={form.age} onChange={(e) => set("age", e.target.value)} className="h-12 rounded-xl text-base" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">Sex</Label>
                  <Select value={form.sex} onValueChange={(v) => set("sex", v)}>
                    <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Height</Label>
                <div className="flex gap-2 items-center">
                  <Input type="number" min={3} max={8} placeholder="5" value={form.heightFt} onChange={(e) => set("heightFt", e.target.value)} className="h-12 rounded-xl text-base w-24" />
                  <span className="text-muted-foreground text-sm font-medium">ft</span>
                  <Input type="number" min={0} max={11} placeholder="7" value={form.heightIn} onChange={(e) => set("heightIn", e.target.value)} className="h-12 rounded-xl text-base w-24" />
                  <span className="text-muted-foreground text-sm font-medium">in</span>
                </div>
                <p className="text-xs text-muted-foreground">Enter feet <em>and</em> inches separately — e.g. 5 ft 7 in for 5′7″</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">Weight (lbs)</Label>
                  <Input type="number" placeholder="180" value={form.weightLbs} onChange={(e) => set("weightLbs", e.target.value)} className="h-12 rounded-xl text-base" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">Body fat %</Label>
                  <Input type="number" placeholder="18" value={form.bodyFatPercent} onChange={(e) => set("bodyFatPercent", e.target.value)} className="h-12 rounded-xl text-base" />
                </div>
              </div>

              <Button
                className="w-full h-12 rounded-2xl font-bold gradient-orange border-0 hover:opacity-90 flex items-center justify-center gap-2"
                onClick={() => setStep("goals")}
                disabled={!form.age || !form.sex || !form.weightLbs || !form.bodyFatPercent || !form.heightFt || heightInches < 48}
              >
                Continue <ChevronRight size={16} />
              </Button>
            </>
          )}

          {step === "goals" && (
            <>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Goal</Label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { value: "lose_fat", label: "Lose fat", sub: "Cut body fat while preserving muscle" },
                    { value: "maintain", label: "Maintain", sub: "Hold current weight and composition" },
                    { value: "build_muscle", label: "Build muscle", sub: "Lean bulk with controlled surplus" },
                  ].map(({ value, label, sub }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => set("goalType", value)}
                      className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl border-2 text-left transition-all ${
                        form.goalType === value ? "border-primary bg-orange-50" : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${form.goalType === value ? "border-primary" : "border-muted-foreground/40"}`}>
                        {form.goalType === value && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{label}</p>
                        <p className="text-xs text-muted-foreground">{sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {form.goalType === "lose_fat" && (
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">Target body fat %</Label>
                  <Input type="number" placeholder="10" value={form.goalBodyFatPercent} onChange={(e) => set("goalBodyFatPercent", e.target.value)} className="h-12 rounded-xl text-base" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">Goal date <span className="font-normal text-muted-foreground">(optional)</span></Label>
                  <Input type="date" value={form.goalDate} onChange={(e) => set("goalDate", e.target.value)} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">Vacation date <span className="font-normal text-muted-foreground">(optional)</span></Label>
                  <Input type="date" value={form.vacationDate} onChange={(e) => set("vacationDate", e.target.value)} className="h-12 rounded-xl" />
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("basics")} className="h-12 rounded-2xl px-5 flex items-center gap-1"><ChevronLeft size={16} /></Button>
                <Button className="flex-1 h-12 rounded-2xl font-bold gradient-orange border-0 hover:opacity-90 flex items-center justify-center gap-2" onClick={() => setStep("lifestyle")} disabled={!form.goalType}>
                  Continue <ChevronRight size={16} />
                </Button>
              </div>
            </>
          )}

          {step === "lifestyle" && (
            <>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Activity level</Label>
                <Select value={form.activityLevel} onValueChange={(v) => set("activityLevel", v)}>
                  <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select activity level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentary (desk job, no exercise)</SelectItem>
                    <SelectItem value="lightly_active">Lightly active (1–3 days/week)</SelectItem>
                    <SelectItem value="moderately_active">Moderately active (3–5 days/week)</SelectItem>
                    <SelectItem value="very_active">Very active (6–7 days/week)</SelectItem>
                    <SelectItem value="extremely_active">Extremely active (2× daily)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Training days per week</Label>
                <Input type="number" min="0" max="7" placeholder="4" value={form.trainingFrequency} onChange={(e) => set("trainingFrequency", e.target.value)} className="h-12 rounded-xl text-base" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Food preferences <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <Textarea placeholder="e.g. chicken, rice, eggs, no shellfish" value={form.foodPreferences} onChange={(e) => set("foodPreferences", e.target.value)} className="rounded-xl resize-none" rows={2} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">Allergies <span className="font-normal text-muted-foreground">(opt)</span></Label>
                  <Input placeholder="e.g. peanuts, dairy" value={form.allergies} onChange={(e) => set("allergies", e.target.value)} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">Supplements <span className="font-normal text-muted-foreground">(opt)</span></Label>
                  <Input placeholder="e.g. creatine" value={form.supplements} onChange={(e) => set("supplements", e.target.value)} className="h-12 rounded-xl" />
                </div>
              </div>

              <button
                type="button"
                onClick={() => set("onTRT", !form.onTRT)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-left ${form.onTRT ? "border-primary bg-orange-50" : "border-border hover:border-primary/40"}`}
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${form.onTRT ? "border-primary bg-primary" : "border-muted-foreground/40"}`}>
                  {form.onTRT && <span className="text-white text-xs font-bold">✓</span>}
                </div>
                <span className="font-semibold text-sm">On TRT / hormone therapy</span>
              </button>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("goals")} className="h-12 rounded-2xl px-5 flex items-center"><ChevronLeft size={16} /></Button>
                <Button className="flex-1 h-12 rounded-2xl font-bold gradient-orange border-0 hover:opacity-90 flex items-center justify-center gap-2" onClick={() => setStep("results")} disabled={!form.activityLevel}>
                  See my plan <ChevronRight size={16} />
                </Button>
              </div>
            </>
          )}

          {step === "results" && physiqueResult && macros && (
            <>
              {/* Sanity check — catches bad height/age data before user saves */}
              {physiqueResult.maintenanceCalories < 1000 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-800 flex gap-2">
                  <span className="shrink-0 text-base">⚠️</span>
                  <div>
                    <p className="font-semibold">These numbers look too low — please go back and check your height.</p>
                    <p className="mt-1 opacity-80">A maintenance below 1,000 cal almost always means the feet field was left blank. Make sure you entered <strong>feet</strong> (e.g. 5) <em>and</em> inches (e.g. 7) separately.</p>
                  </div>
                </div>
              )}
              {/* Current vs Goal */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted rounded-2xl p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Now</p>
                  <p className="text-2xl font-black">{form.weightLbs}<span className="text-sm font-medium text-muted-foreground ml-1">lbs</span></p>
                  <p className="text-sm text-muted-foreground">{form.bodyFatPercent}% body fat</p>
                </div>
                <div className="gradient-orange-soft rounded-2xl p-4 border border-orange-100">
                  <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Goal</p>
                  <p className="text-2xl font-black text-primary">{physiqueResult.goalWeightLbs}<span className="text-sm font-medium text-primary/70 ml-1">lbs</span></p>
                  <p className="text-sm text-primary/70">{form.goalBodyFatPercent || "—"}% body fat</p>
                </div>
              </div>

              {physiqueResult.weeksToGoal > 0 && (
                <div className="bg-foreground rounded-2xl p-4 flex items-center justify-between">
                  <p className="text-background font-semibold text-sm">Estimated timeline</p>
                  <p className="text-white font-black text-lg">{physiqueResult.weeksToGoal} weeks</p>
                </div>
              )}

              {/* Calorie target */}
              <div className="gradient-orange rounded-2xl p-5 text-center">
                <p className="text-orange-200 text-xs font-bold uppercase tracking-widest mb-1">Daily calories</p>
                <p className="text-5xl font-black text-white tracking-tight">{physiqueResult.targetCalories}</p>
                <p className="text-orange-200 text-sm mt-1">Maintenance: {physiqueResult.maintenanceCalories} kcal</p>
              </div>

              {/* Macros */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Protein", value: macros.proteinG, color: "text-blue-600", bg: "bg-blue-50" },
                  { label: "Carbs", value: macros.carbsG, color: "text-amber-600", bg: "bg-amber-50" },
                  { label: "Fat", value: macros.fatG, color: "text-orange-600", bg: "bg-orange-50" },
                ].map((m) => (
                  <div key={m.label} className={`${m.bg} rounded-2xl p-4 text-center`}>
                    <p className={`text-2xl font-black ${m.color}`}>{m.value}<span className="text-sm">g</span></p>
                    <p className={`text-xs font-bold ${m.color} opacity-70 mt-0.5`}>{m.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("lifestyle")} className="h-12 rounded-2xl px-5 flex items-center"><ChevronLeft size={16} /></Button>
                <Button className="flex-1 h-12 rounded-2xl font-bold gradient-orange border-0 hover:opacity-90 text-base flex items-center justify-center gap-2" onClick={saveAndFinish} disabled={saving}>
                  {saving ? "Saving…" : "Start my journey →"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
