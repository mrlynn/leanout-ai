"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, ChevronLeft } from "lucide-react";
import { BillingSettings } from "@/components/BillingSettings";
import { AccountabilityPartner } from "@/components/AccountabilityPartner";
import Link from "next/link";
import { PageContainer } from "@/components/PageContainer";
import { HealthSyncButton } from "@/components/HealthSyncButton";
import { LegalFooterLinks } from "@/components/legal/LegalFooterLinks";

function fmtDate(d?: string) {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [form, setForm] = useState({
    name: "",
    age: "",
    sex: "",
    heightFt: "",
    heightIn: "",
    weightLbs: "",
    bodyFatPercent: "",
    goalBodyFatPercent: "",
    activityLevel: "",
    trainingFrequency: "",
    goalType: "",
    goalDate: "",
    vacationDate: "",
    foodPreferences: "",
    allergies: "",
    supplements: "",
    onTRT: false,
    reminderHour: "20",
    remindersEnabled: true,
  });

  useEffect(() => {
    fetch("/api/billing/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setIsPro(d.planTier === "pro"); });
  }, []);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then(({ user }) => {
        if (!user) return;
        const ft = user.heightInches ? Math.floor(user.heightInches / 12) : "";
        const inches = user.heightInches ? user.heightInches % 12 : "";
        setForm({
          name: user.name ?? "",
          age: user.age ? String(user.age) : "",
          sex: user.sex ?? "",
          heightFt: String(ft),
          heightIn: String(inches),
          weightLbs: user.weightLbs ? String(user.weightLbs) : "",
          bodyFatPercent: user.bodyFatPercent ? String(user.bodyFatPercent) : "",
          goalBodyFatPercent: user.goalBodyFatPercent ? String(user.goalBodyFatPercent) : "",
          activityLevel: user.activityLevel ?? "",
          trainingFrequency: user.trainingFrequency ? String(user.trainingFrequency) : "",
          goalType: user.goalType ?? "",
          goalDate: fmtDate(user.goalDate),
          vacationDate: fmtDate(user.vacationDate),
          foodPreferences: user.foodPreferences ?? "",
          allergies: user.allergies ?? "",
          supplements: user.supplements ?? "",
          onTRT: user.onTRT ?? false,
          reminderHour: String(user.reminderHour ?? 20),
          remindersEnabled: user.remindersEnabled !== false,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setSaved(false);
    const heightInches = parseInt(form.heightFt || "0") * 12 + parseInt(form.heightIn || "0");
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        age: parseInt(form.age),
        sex: form.sex,
        heightInches,
        weightLbs: parseFloat(form.weightLbs),
        bodyFatPercent: parseFloat(form.bodyFatPercent),
        goalBodyFatPercent: form.goalBodyFatPercent ? parseFloat(form.goalBodyFatPercent) : undefined,
        activityLevel: form.activityLevel,
        trainingFrequency: parseInt(form.trainingFrequency),
        goalType: form.goalType,
        goalDate: form.goalDate || undefined,
        vacationDate: form.vacationDate || undefined,
        foodPreferences: form.foodPreferences,
        allergies: form.allergies,
        supplements: form.supplements,
        onTRT: form.onTRT,
        reminderHour: parseInt(form.reminderHour),
        remindersEnabled: form.remindersEnabled,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-orange pt-10 pb-14">
        <PageContainer>
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-orange-200 text-sm mb-4 hover:text-white">
            <ChevronLeft size={16} /> Dashboard
          </Link>
          <h1 className="text-3xl font-black text-white tracking-tight">Settings</h1>
          <p className="text-orange-200 text-sm mt-1">Update your profile, goals, and preferences</p>
        </PageContainer>
      </div>

      <PageContainer className="-mt-6 pb-12 space-y-5">
        <div className="bg-white rounded-3xl card-shadow p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Plan & Billing</p>
          <BillingSettings />
        </div>

        {[
          { title: "Profile", fields: (
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Age</Label><Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="mt-1" /></div>
                <div>
                  <Label>Sex</Label>
                  <Select value={form.sex} onValueChange={(v) => setForm({ ...form, sex: v ?? "" })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )},
          { title: "Body stats", fields: (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Height (ft)</Label><Input type="number" value={form.heightFt} onChange={(e) => setForm({ ...form, heightFt: e.target.value })} className="mt-1" /></div>
                <div><Label>Height (in)</Label><Input type="number" value={form.heightIn} onChange={(e) => setForm({ ...form, heightIn: e.target.value })} className="mt-1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Weight (lbs)</Label><Input type="number" value={form.weightLbs} onChange={(e) => setForm({ ...form, weightLbs: e.target.value })} className="mt-1" /></div>
                <div><Label>Body fat %</Label><Input type="number" value={form.bodyFatPercent} onChange={(e) => setForm({ ...form, bodyFatPercent: e.target.value })} className="mt-1" /></div>
              </div>
            </div>
          )},
          { title: "Goals", fields: (
            <div className="space-y-4">
              <div>
                <Label>Goal type</Label>
                <Select value={form.goalType} onValueChange={(v) => setForm({ ...form, goalType: v ?? "" })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lose_fat">Lose fat</SelectItem>
                    <SelectItem value="maintain">Maintain</SelectItem>
                    <SelectItem value="build_muscle">Build muscle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Target body fat %</Label><Input type="number" value={form.goalBodyFatPercent} onChange={(e) => setForm({ ...form, goalBodyFatPercent: e.target.value })} className="mt-1" placeholder="e.g. 12" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Goal date</Label><Input type="date" value={form.goalDate} onChange={(e) => setForm({ ...form, goalDate: e.target.value })} className="mt-1" /></div>
                <div><Label>Vacation date</Label><Input type="date" value={form.vacationDate} onChange={(e) => setForm({ ...form, vacationDate: e.target.value })} className="mt-1" /></div>
              </div>
            </div>
          )},
          { title: "Dietary preferences", fields: (
            <div className="space-y-4">
              <div><Label>Food preferences</Label><Textarea value={form.foodPreferences} onChange={(e) => setForm({ ...form, foodPreferences: e.target.value })} className="mt-1" rows={2} /></div>
              <div><Label>Allergies</Label><Textarea value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} className="mt-1" rows={2} /></div>
              <div><Label>Supplements</Label><Textarea value={form.supplements} onChange={(e) => setForm({ ...form, supplements: e.target.value })} className="mt-1" rows={2} /></div>
            </div>
          )},
          { title: "Reminders", fields: (
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.remindersEnabled} onChange={(e) => setForm({ ...form, remindersEnabled: e.target.checked })} className="w-4 h-4 accent-primary" />
                <span className="text-sm font-medium">Daily check-in reminders</span>
              </label>
              <div><Label>Reminder hour (0–23)</Label><Input type="number" min={0} max={23} value={form.reminderHour} onChange={(e) => setForm({ ...form, reminderHour: e.target.value })} className="mt-1 w-24" /></div>
            </div>
          )},
        ].map(({ title, fields }) => (
          <div key={title} className="bg-white rounded-3xl card-shadow p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">{title}</p>
            {fields}
          </div>
        ))}

        <div className="bg-white rounded-3xl card-shadow p-6">
          <AccountabilityPartner isPro={isPro} />
        </div>

        <div className="bg-white rounded-3xl card-shadow p-6 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Health sync</p>
          <p className="text-sm text-muted-foreground">
            Connect Apple Health or Health Connect in the mobile app to auto-fill steps and weight on check-in.
          </p>
          <HealthSyncButton />
        </div>

        <div className="bg-white rounded-3xl card-shadow p-6 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Data & privacy</p>
          <p className="text-sm text-muted-foreground">Download a JSON export of your check-ins, food logs, workouts, and progress data.</p>
          <a
            href="/api/user/export"
            className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-bold hover:bg-muted/50"
          >
            Export my data
          </a>
          <LegalFooterLinks className="justify-start pt-1" />
        </div>

        <Button onClick={save} disabled={saving} className="w-full gradient-orange border-0 h-12 rounded-2xl font-bold hover:opacity-90">
          {saving ? <Loader2 className="animate-spin" size={18} /> : saved ? "Saved ✓" : <><Save size={16} className="mr-2" /> Save changes</>}
        </Button>
      </PageContainer>
    </div>
  );
}
