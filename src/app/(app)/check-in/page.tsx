"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Scale, Footprints, Dumbbell, Pencil, X, Check } from "lucide-react";
import { CheckInCelebration } from "@/components/CheckInCelebration";

interface CheckIn {
  _id: string;
  date: string;
  weightLbs: number;
  steps?: number;
  hunger: number;
  energy: number;
  compliance: number;
  workoutCompleted: boolean;
  notes?: string;
}

type FormState = {
  weightLbs: string;
  steps: string;
  hunger: number;
  energy: number;
  compliance: number;
  workoutCompleted: boolean;
  notes: string;
};

function emptyForm(): FormState {
  return { weightLbs: "", steps: "", hunger: 0, energy: 0, compliance: 0, workoutCompleted: false, notes: "" };
}

function fromCheckIn(c: CheckIn): FormState {
  return {
    weightLbs: String(c.weightLbs),
    steps: c.steps ? String(c.steps) : "",
    hunger: c.hunger,
    energy: c.energy,
    compliance: c.compliance,
    workoutCompleted: c.workoutCompleted,
    notes: c.notes ?? "",
  };
}

function ScoreSelector({ value, onChange, lowLabel, highLabel }: {
  value: number; onChange: (v: number) => void; lowLabel: string; highLabel: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {[1,2,3,4,5,6,7,8,9,10].map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)}
            className={`flex-1 h-9 rounded-lg text-sm font-bold transition-all ${
              value === n ? "gradient-orange text-white shadow-sm"
              : n < value ? "bg-orange-100 text-orange-700"
              : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >{n}</button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{lowLabel}</span><span>{highLabel}</span>
      </div>
    </div>
  );
}

function CheckInForm({
  form, setForm, onSubmit, onCancel, saving, isEdit,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel?: () => void;
  saving: boolean;
  isEdit?: boolean;
}) {
  function set(field: keyof FormState, value: string | number | boolean) {
    setForm({ ...form, [field]: value });
  }
  const valid = !!form.weightLbs && form.hunger > 0 && form.energy > 0 && form.compliance > 0;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="bg-white rounded-3xl card-shadow-md p-6 space-y-5">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Stats</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-1.5">
              <Scale size={14} className="text-primary" /> Weight
            </Label>
            <div className="relative">
              <Input type="number" step="0.1" placeholder="179.5" value={form.weightLbs}
                onChange={(e) => set("weightLbs", e.target.value)}
                className="h-12 rounded-xl pr-10 text-base font-bold" required />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">lbs</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-1.5">
              <Footprints size={14} className="text-blue-500" /> Steps
            </Label>
            <Input type="number" placeholder="8,000" value={form.steps}
              onChange={(e) => set("steps", e.target.value)}
              className="h-12 rounded-xl text-base font-bold" />
          </div>
        </div>
        <button type="button"
          onClick={() => set("workoutCompleted", !form.workoutCompleted)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all ${
            form.workoutCompleted ? "border-primary bg-orange-50" : "border-border hover:border-primary/40"
          }`}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${form.workoutCompleted ? "gradient-orange" : "bg-muted"}`}>
            <Dumbbell size={16} className={form.workoutCompleted ? "text-white" : "text-muted-foreground"} />
          </div>
          <span className="font-semibold text-sm">
            {form.workoutCompleted ? "Workout completed ✓" : "Tap to mark workout done"}
          </span>
        </button>
      </div>

      <div className="bg-white rounded-3xl card-shadow p-6 space-y-6">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">How do you feel?</p>
        {[
          { key: "hunger",     label: "Hunger",          lowLabel: "Never hungry",  highLabel: "Always starving" },
          { key: "energy",     label: "Energy",          lowLabel: "Exhausted",     highLabel: "Feeling great"   },
          { key: "compliance", label: "Diet compliance", lowLabel: "Off plan",      highLabel: "Perfect"         },
        ].map(({ key, label, lowLabel, highLabel }) => (
          <div key={key} className="space-y-2">
            <Label className="text-sm font-semibold">{label}</Label>
            <ScoreSelector value={form[key as keyof FormState] as number}
              onChange={(v) => set(key as keyof FormState, v)}
              lowLabel={lowLabel} highLabel={highLabel} />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl card-shadow p-6 space-y-3">
        <Label className="text-sm font-semibold">Notes <span className="font-normal text-muted-foreground">(optional)</span></Label>
        <Textarea placeholder="How are you feeling? Anything unusual?" value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          className="rounded-xl resize-none" rows={2} />
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="h-12 rounded-2xl px-5">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={saving || !valid}
          className="flex-1 h-12 rounded-2xl font-bold gradient-orange border-0 hover:opacity-90 text-base">
          {saving ? "Saving…" : isEdit ? "Save changes" : "Save check-in →"}
        </Button>
      </div>
    </form>
  );
}

function HistoryItem({ checkIn, onUpdated }: { checkIn: CheckIn; onUpdated: (c: CheckIn) => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(fromCheckIn(checkIn));
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/check-in", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: checkIn._id,
        weightLbs: parseFloat(form.weightLbs),
        steps: form.steps ? parseInt(form.steps) : undefined,
        hunger: form.hunger,
        energy: form.energy,
        compliance: form.compliance,
        workoutCompleted: form.workoutCompleted,
        notes: form.notes || undefined,
      }),
    });
    const data = await res.json();
    if (data.checkIn) onUpdated(data.checkIn);
    setSaving(false);
    setEditing(false);
  }

  const dateLabel = new Date(checkIn.date).toLocaleDateString("en-US", {
    weekday: "long", month: "short", day: "numeric",
  });

  if (editing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <p className="font-bold text-sm text-muted-foreground">{dateLabel}</p>
          <button onClick={() => { setEditing(false); setForm(fromCheckIn(checkIn)); }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <X size={14} /> Cancel
          </button>
        </div>
        <CheckInForm form={form} setForm={setForm} onSubmit={handleSave}
          onCancel={() => { setEditing(false); setForm(fromCheckIn(checkIn)); }}
          saving={saving} isEdit />
      </div>
    );
  }

  return (
    <button onClick={() => setEditing(true)}
      className="w-full text-left bg-white rounded-2xl card-shadow px-5 py-4 flex items-center gap-4 hover:shadow-md transition-shadow group">
      {/* Date + scores */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-bold text-sm">{dateLabel}</p>
          {checkIn.workoutCompleted && (
            <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">
              Trained
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
          <span>Compliance <strong className="text-foreground">{checkIn.compliance}/10</strong></span>
          <span>Energy <strong className="text-foreground">{checkIn.energy}/10</strong></span>
          <span>Hunger <strong className="text-foreground">{checkIn.hunger}/10</strong></span>
          {checkIn.steps && <span>Steps <strong className="text-foreground">{checkIn.steps.toLocaleString()}</strong></span>}
        </div>
        {checkIn.notes && (
          <p className="text-xs text-muted-foreground mt-1.5 italic truncate">"{checkIn.notes}"</p>
        )}
      </div>

      {/* Weight */}
      <div className="text-right shrink-0">
        <p className="text-2xl font-black leading-none">{checkIn.weightLbs}</p>
        <p className="text-xs text-muted-foreground">lbs</p>
      </div>

      {/* Edit hint */}
      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Pencil size={15} className="text-muted-foreground" />
      </div>
    </button>
  );
}

interface Reward { xpGained: number; newBadges: string[]; newStreak: number; leveledUp: boolean; newLevel: number; }

export default function CheckInPage() {
  const [form, setForm] = useState<FormState>(emptyForm());
  const [history, setHistory] = useState<CheckIn[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reward, setReward] = useState<Reward | null>(null);

  useEffect(() => {
    fetch("/api/check-in?limit=14")
      .then((r) => r.json())
      .then((d) => setHistory(d.checkIns ?? []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        weightLbs: parseFloat(form.weightLbs),
        steps: form.steps ? parseInt(form.steps) : undefined,
        hunger: form.hunger, energy: form.energy, compliance: form.compliance,
        workoutCompleted: form.workoutCompleted,
        notes: form.notes || undefined,
      }),
    });
    const data = await res.json();
    if (data.checkIn) {
      setHistory((prev) => {
        const filtered = prev.filter((c) => c._id !== data.checkIn._id);
        return [data.checkIn, ...filtered];
      });
    }
    if (data.reward) setReward(data.reward);
    setSaving(false);
    setSaved(true);
    setForm(emptyForm());
  }

  function handleUpdated(updated: CheckIn) {
    setHistory((prev) => prev.map((c) => c._id === updated._id ? updated : c));
  }

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const todayCheckIn = history.find((c) => {
    const d = new Date(c.date);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  });
  const pastHistory = history.filter((c) => c !== todayCheckIn);

  return (
    <>
    <div className="min-h-screen bg-background">
      <div className="gradient-orange px-6 pt-10 pb-14 md:pt-12">
        <div className="max-w-lg mx-auto">
          <p className="text-orange-200 text-sm font-medium">{today}</p>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">Daily Check-in</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 -mt-6 pb-10 space-y-6">
        {/* Today's check-in */}
        <div>
          {saved && !todayCheckIn ? (
            <div className="bg-white rounded-3xl card-shadow-md p-10 text-center space-y-4">
              <CheckCircle2 size={48} className="text-green-500 mx-auto" />
              <p className="text-xl font-black">Check-in saved!</p>
              <p className="text-muted-foreground text-sm">Great work staying consistent.</p>
              <Button variant="outline" onClick={() => setSaved(false)} className="rounded-xl">
                Edit today
              </Button>
            </div>
          ) : todayCheckIn && !saved ? (
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Today</p>
              <HistoryItem checkIn={todayCheckIn} onUpdated={handleUpdated} />
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Today</p>
              <CheckInForm form={form} setForm={setForm} onSubmit={handleSubmit} saving={saving} />
            </div>
          )}
        </div>

        {/* Past check-ins */}
        {pastHistory.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
              History <span className="font-normal normal-case">· tap any entry to edit</span>
            </p>
            <div className="space-y-2">
              {pastHistory.map((c) => (
                <HistoryItem key={c._id} checkIn={c} onUpdated={handleUpdated} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>

    {reward && (
      <CheckInCelebration reward={reward} onClose={() => setReward(null)} />
    )}
  </>
  );
}
