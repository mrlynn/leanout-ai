"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Camera,
  Mic,
  ClipboardCheck,
  UtensilsCrossed,
  DollarSign,
  TrendingUp,
  Loader2,
  Trash2,
  ChevronRight,
  RefreshCw,
  ShieldAlert,
  Pencil,
  Zap,
  BarChart2,
  SlidersHorizontal,
  Save,
  Info,
  BookOpen,
  Plus,
  X,
  Eye,
  EyeOff,
  Sparkles,
  Wand2,
  ChevronDown,
  ChevronUp,
  Check,
  Dumbbell,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/PageContainer";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";

type Tab = "overview" | "users" | "features" | "costs" | "limits" | "guides";

interface LimitConfig {
  mealPlansPerMonth: number;
  photoLogsPerDay: number;
  voiceLogsPerDay: number;
  coachMessagesPerDay: number;
  workoutGenerationsPerMonth: number;
}

interface HealthCheck {
  status: string;
  latencyMs?: number;
  error?: string;
  required?: boolean;
}

interface HealthSnapshot {
  ok: boolean;
  checkedAt: string;
  mongodb: string;
  missingEnv: string[];
  providerFailures: { name: string; error?: string }[];
  source: "cron" | "manual";
}

interface HealthReport {
  ok: boolean;
  checkedAt: string;
  checks: {
    mongodb: HealthCheck;
    env: Record<string, HealthCheck>;
    providers?: {
      anthropic: HealthCheck;
      openai: HealthCheck;
    };
  };
  lastAutomatedCheck?: HealthSnapshot | null;
}

interface StatsData {
  users: {
    total: number;
    onboarded: number;
    newLast30: number;
    newLast7: number;
    onboardRate: number;
  };
  foodLog: {
    total: number;
    last30: number;
    bySource: { vision: number; voice: number; manual: number; meal_plan: number };
  };
  checkIns: { total: number; last30: number };
  mealPlans: { total: number; last30: number };
  breakdown: {
    goals: Record<string, number>;
    activity: Record<string, number>;
    sex: Record<string, number>;
  };
  aiCosts: {
    estimated: { vision: number; voice: number; mealPlans: number };
    total: number;
    note: string;
  };
  recentUsers: {
    _id: string;
    name: string;
    email: string;
    onboardingComplete: boolean;
    goalType?: string;
    createdAt: string;
    xp?: number;
    currentStreak?: number;
  }[];
  charts: {
    dailySignups: { _id: string; count: number }[];
    dailyFoodLogs: { _id: string; count: number }[];
  };
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconColor,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconColor: string;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconColor}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="text-3xl font-black text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function MiniBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground capitalize">{label.replace(/_/g, " ")}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SparkLine({ data, color }: { data: { _id: string; count: number }[]; color: string }) {
  if (!data.length) return <p className="text-xs text-muted-foreground text-center py-4">No data yet</p>;
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d) => (
        <div key={d._id} className="flex-1 flex flex-col items-center justify-end gap-0.5" title={`${d._id}: ${d.count}`}>
          <div
            className={`w-full rounded-t-sm ${color}`}
            style={{ height: `${Math.max(4, (d.count / max) * 56)}px` }}
          />
        </div>
      ))}
    </div>
  );
}

const GOAL_LABELS: Record<string, string> = {
  lose_fat: "Lose Fat",
  maintain: "Maintain",
  build_muscle: "Build Muscle",
};

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "Sedentary",
  lightly_active: "Lightly Active",
  moderately_active: "Moderately Active",
  very_active: "Very Active",
  extremely_active: "Extremely Active",
};

function statusStyles(status: string) {
  if (status === "ok") return "bg-green-50 text-green-700 border-green-200";
  if (status === "missing") return "bg-amber-50 text-amber-700 border-amber-200";
  if (status === "skipped") return "bg-muted text-muted-foreground border-border";
  return "bg-red-50 text-red-700 border-red-200";
}

function StatusPill({ label, check }: { label: string; check: HealthCheck }) {
  return (
    <div className={`rounded-xl border px-3 py-2 ${statusStyles(check.status)}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold">{label}</span>
        <span className="text-[10px] uppercase tracking-wider font-bold">{check.status}</span>
      </div>
      {check.latencyMs != null && (
        <p className="text-[10px] mt-1 opacity-80">{check.latencyMs}ms</p>
      )}
      {check.error && (
        <p className="text-[10px] mt-1 opacity-90 break-words">{check.error}</p>
      )}
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [limits, setLimits] = useState<LimitConfig | null>(null);
  const [limitsForm, setLimitsForm] = useState<LimitConfig | null>(null);
  const [proLimits, setProLimits] = useState<LimitConfig | null>(null);
  const [proLimitsForm, setProLimitsForm] = useState<LimitConfig | null>(null);
  const [savingLimits, setSavingLimits] = useState(false);
  const [limitsSaved, setLimitsSaved] = useState(false);
  const [health, setHealth] = useState<HealthReport | null>(null);
  const [healthProbing, setHealthProbing] = useState(false);

  // Guides state
  type GuideDoc = {
    _id: string; title: string; slug: string; summary: string;
    content: string; emoji: string; category: string; tags: string[];
    published: boolean; createdAt: string; updatedAt: string;
  };
  const BLANK_GUIDE = { title: "", summary: "", content: "", emoji: "📖", category: "General", tags: [] as string[], published: false };
  const [guides, setGuides] = useState<GuideDoc[]>([]);
  const [guidesLoading, setGuidesLoading] = useState(false);
  const [editingGuide, setEditingGuide] = useState<GuideDoc | null>(null);
  const [guideForm, setGuideForm] = useState(BLANK_GUIDE);
  const [guidePreview, setGuidePreview] = useState(false);
  const [guideSaving, setGuideSaving] = useState(false);
  const [guideDeletingSlug, setGuideDeletingSlug] = useState<string | null>(null);
  const [guideTagInput, setGuideTagInput] = useState("");
  // AI assist state
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInstruction, setAiInstruction] = useState("");
  const [aiStreaming, setAiStreaming] = useState(false);
  const [aiDraft, setAiDraft] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/stats");
      if (res.status === 403) {
        setError("forbidden");
        return;
      }
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to load stats");
      setStats(await res.json());

      const configRes = await fetch("/api/admin/config");
      if (!configRes.ok) {
        throw new Error("Failed to load limits config");
      }
      const { limits: l, proLimits: pl } = await configRes.json();
      setLimits(l);
      setLimitsForm(l);
      setProLimits(pl);
      setProLimitsForm(pl);

      const healthRes = await fetch("/api/admin/health");
      if (healthRes.ok) {
        setHealth(await healthRes.json());
      }
    } catch {
      setError("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, [router]);

  async function probeHealth() {
    setHealthProbing(true);
    try {
      const res = await fetch("/api/admin/health?probe=true&persist=true");
      if (res.ok) {
        setHealth(await res.json());
      }
    } finally {
      setHealthProbing(false);
    }
  }

  useEffect(() => {
    load();
  }, [load]);

  async function saveLimits() {
    if (!limitsForm || !proLimitsForm) return;
    setSavingLimits(true);
    try {
      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limits: limitsForm, proLimits: proLimitsForm }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Failed to save limits");
      }
      const { limits: l, proLimits: pl } = await res.json();
      setLimits(l);
      setLimitsForm(l);
      setProLimits(pl);
      setProLimitsForm(pl);
      setLimitsSaved(true);
      setTimeout(() => setLimitsSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save limits");
    } finally {
      setSavingLimits(false);
    }
  }

  async function deleteUser(id: string, name: string) {
    if (!confirm(`Permanently delete ${name} and all their data? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error ?? "Delete failed");
        return;
      }
      await load();
    } finally {
      setDeletingId(null);
    }
  }

  const loadGuides = useCallback(async () => {
    setGuidesLoading(true);
    try {
      const r = await fetch("/api/guides?all=true");
      if (r.ok) setGuides(await r.json());
    } finally {
      setGuidesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "guides") loadGuides();
  }, [tab, loadGuides]);

  function openNewGuide() {
    setEditingGuide(null);
    setGuideForm(BLANK_GUIDE);
    setGuideTagInput("");
    setGuidePreview(false);
    setAiOpen(false);
    setAiDraft("");
    setAiInstruction("");
  }

  function openEditGuide(g: GuideDoc) {
    setEditingGuide(g);
    setGuideForm({ title: g.title, summary: g.summary, content: g.content, emoji: g.emoji, category: g.category, tags: [...g.tags], published: g.published });
    setGuideTagInput("");
    setGuidePreview(false);
    setAiOpen(false);
    setAiDraft("");
    setAiInstruction("");
  }

  async function runAi(action: "generate" | "improve" | "custom") {
    if (!guideForm.title.trim()) return;
    setAiStreaming(true);
    setAiDraft("");
    setAiOpen(true);
    try {
      const res = await fetch("/api/admin/guides/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          title: guideForm.title,
          summary: guideForm.summary,
          category: guideForm.category,
          content: guideForm.content,
          instruction: aiInstruction,
        }),
      });
      if (!res.ok || !res.body) { setAiStreaming(false); return; }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setAiDraft(accumulated);
      }
    } finally {
      setAiStreaming(false);
    }
  }

  function applyAiDraft() {
    setGuideForm((f) => ({ ...f, content: aiDraft }));
    setAiDraft("");
    setAiOpen(false);
  }

  async function saveGuide() {
    if (!guideForm.title.trim()) return;
    setGuideSaving(true);
    try {
      const method = editingGuide ? "PUT" : "POST";
      const url = editingGuide ? `/api/guides/${editingGuide.slug}` : "/api/guides";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(guideForm) });
      if (r.ok) {
        setEditingGuide(null);
        await loadGuides();
      }
    } finally {
      setGuideSaving(false);
    }
  }

  async function deleteGuide(slug: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setGuideDeletingSlug(slug);
    try {
      await fetch(`/api/guides/${slug}`, { method: "DELETE" });
      await loadGuides();
    } finally {
      setGuideDeletingSlug(null);
    }
  }

  function addTag() {
    const t = guideTagInput.trim();
    if (t && !guideForm.tags.includes(t)) {
      setGuideForm({ ...guideForm, tags: [...guideForm.tags, t] });
    }
    setGuideTagInput("");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (error === "forbidden") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4">
        <ShieldAlert size={48} className="text-red-500" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">This page is restricted to the site administrator.</p>
        <Button onClick={() => router.push("/dashboard")}>Back to dashboard</Button>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">{error || "No data"}</p>
        <Button onClick={load}>Retry</Button>
      </div>
    );
  }

  const totalFoodBySource = Object.values(stats.foodLog.bySource).reduce((a, b) => a + b, 0);

  return (
    <PageContainer size="wide" className="py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" fill="white" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Admin Dashboard</h1>
            <p className="text-xs text-muted-foreground">LeanOut AI — Site Administration</p>
          </div>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/40 border border-border rounded-2xl p-1 mb-8">
        {([
          { id: "overview", label: "Overview", icon: BarChart2 },
          { id: "users", label: "Users", icon: Users },
          { id: "features", label: "Feature Usage", icon: TrendingUp },
          { id: "costs", label: "AI Costs", icon: DollarSign },
        { id: "limits", label: "Limits", icon: SlidersHorizontal },
          { id: "guides", label: "Guides", icon: BookOpen },
        ] as { id: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === id ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {tab === "overview" && (
        <div className="space-y-6">
          {health && (
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${health.ok ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                      <Activity size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">System health</p>
                      <p className="text-sm font-semibold text-foreground">
                        {health.ok ? "All required services are healthy" : "One or more services need attention"}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Live check: {new Date(health.checkedAt).toLocaleString()}
                  </p>
                  {health.lastAutomatedCheck && (
                    <p className="text-xs text-muted-foreground">
                      Last cron ({health.lastAutomatedCheck.source}):{" "}
                      {new Date(health.lastAutomatedCheck.checkedAt).toLocaleString()}
                      {health.lastAutomatedCheck.ok ? " — ok" : " — failed"}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 shrink-0"
                  onClick={probeHealth}
                  disabled={healthProbing}
                >
                  {healthProbing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  Test API keys
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <StatusPill label="MongoDB" check={health.checks.mongodb} />
                {health.checks.providers ? (
                  <>
                    <StatusPill label="Anthropic" check={health.checks.providers.anthropic} />
                    <StatusPill label="OpenAI" check={health.checks.providers.openai} />
                  </>
                ) : (
                  <div className="md:col-span-2 rounded-xl border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                    API key probes not run yet. Click &quot;Test API keys&quot; to verify Anthropic and OpenAI credentials.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {Object.entries(health.checks.env).map(([key, check]) => (
                  <StatusPill key={key} label={key.replace(/_API_KEY$/, "")} check={check} />
                ))}
              </div>

              <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Monitoring setup</p>
                <p>Uptime monitor URL: <code className="text-[11px]">/api/health</code> (expect HTTP 200)</p>
                <p>Cron runs every 30 minutes via Vercel — requires <code className="text-[11px]">CRON_SECRET</code></p>
                <p>Alerts email <code className="text-[11px]">ADMIN_EMAIL</code> when health fails (needs <code className="text-[11px]">RESEND_API_KEY</code>)</p>
                <p>Before deploy: <code className="text-[11px]">npm run check:env:strict</code></p>
              </div>
            </div>
          )}

          {/* KPI grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Users"
              value={stats.users.total}
              sub={`+${stats.users.newLast7} this week`}
              icon={Users}
              iconColor="bg-blue-50 text-blue-500"
            />
            <StatCard
              label="Onboard Rate"
              value={`${stats.users.onboardRate}%`}
              sub={`${stats.users.onboarded} of ${stats.users.total} completed`}
              icon={ChevronRight}
              iconColor="bg-green-50 text-green-500"
            />
            <StatCard
              label="Food Logs (30d)"
              value={stats.foodLog.last30}
              sub={`${stats.foodLog.total} all-time`}
              icon={Camera}
              iconColor="bg-orange-50 text-orange-500"
            />
            <StatCard
              label="Check-ins (30d)"
              value={stats.checkIns.last30}
              sub={`${stats.checkIns.total} all-time`}
              icon={ClipboardCheck}
              iconColor="bg-purple-50 text-purple-500"
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                New signups — last 30 days
              </p>
              <SparkLine data={stats.charts.dailySignups} color="bg-blue-400" />
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {stats.users.newLast30} total this period
              </p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                Food log entries — last 30 days
              </p>
              <SparkLine data={stats.charts.dailyFoodLogs} color="bg-orange-400" />
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {stats.foodLog.last30} total this period
              </p>
            </div>
          </div>

          {/* Breakdown row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Goal breakdown</p>
              <div className="space-y-3">
                {Object.entries(stats.breakdown.goals).map(([k, v]) => (
                  <MiniBar key={k} label={GOAL_LABELS[k] ?? k} value={v} max={stats.users.onboarded} color="bg-primary" />
                ))}
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Activity level</p>
              <div className="space-y-3">
                {Object.entries(stats.breakdown.activity).map(([k, v]) => (
                  <MiniBar key={k} label={ACTIVITY_LABELS[k] ?? k} value={v} max={stats.users.onboarded} color="bg-blue-400" />
                ))}
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Sex</p>
              <div className="space-y-3">
                {Object.entries(stats.breakdown.sex).map(([k, v]) => (
                  <MiniBar key={k} label={k} value={v} max={stats.users.onboarded} color="bg-purple-400" />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── USERS TAB ── */}
      {tab === "users" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 mb-2">
            <StatCard label="Total Users" value={stats.users.total} icon={Users} iconColor="bg-blue-50 text-blue-500" />
            <StatCard label="New (30d)" value={stats.users.newLast30} icon={TrendingUp} iconColor="bg-green-50 text-green-500" />
            <StatCard label="Onboarded" value={stats.users.onboarded} sub={`${stats.users.onboardRate}%`} icon={ChevronRight} iconColor="bg-orange-50 text-orange-500" />
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <p className="font-bold text-sm">Recent users (latest 20)</p>
              <span className="text-xs text-muted-foreground">{stats.users.total} total</span>
            </div>
            <div className="divide-y divide-border">
              {stats.recentUsers.map((u) => (
                <div key={u._id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    {u.onboardingComplete ? (
                      <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                        Onboarded
                      </span>
                    ) : (
                      <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                        Pending
                      </span>
                    )}
                    {u.goalType && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {GOAL_LABELS[u.goalType] ?? u.goalType}
                      </span>
                    )}
                  </div>
                  <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                    <span className="flex items-center gap-1">
                      <Zap size={11} className="text-amber-500" /> {u.xp ?? 0} XP
                    </span>
                    <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteUser(u._id, u.name)}
                    disabled={deletingId === u._id}
                    className="text-muted-foreground hover:text-red-500 transition-colors p-1 shrink-0"
                    title="Delete user"
                  >
                    {deletingId === u._id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── FEATURE USAGE TAB ── */}
      {tab === "features" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Meal Plans"
              value={stats.mealPlans.total}
              sub={`${stats.mealPlans.last30} in last 30d`}
              icon={UtensilsCrossed}
              iconColor="bg-amber-50 text-amber-500"
            />
            <StatCard
              label="Photo Logs"
              value={stats.foodLog.bySource.vision}
              icon={Camera}
              iconColor="bg-violet-50 text-violet-500"
            />
            <StatCard
              label="Voice Logs"
              value={stats.foodLog.bySource.voice}
              icon={Mic}
              iconColor="bg-pink-50 text-pink-500"
            />
            <StatCard
              label="Check-ins"
              value={stats.checkIns.total}
              sub={`${stats.checkIns.last30} in last 30d`}
              icon={ClipboardCheck}
              iconColor="bg-green-50 text-green-500"
            />
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Food log by entry method</p>
            <div className="space-y-3">
              {([
                { key: "vision", label: "AI Photo", color: "bg-violet-400", icon: Camera },
                { key: "voice", label: "AI Voice", color: "bg-pink-400", icon: Mic },
                { key: "manual", label: "Manual entry", color: "bg-blue-400", icon: Pencil },
                { key: "meal_plan", label: "From meal plan", color: "bg-amber-400", icon: UtensilsCrossed },
              ] as const).map(({ key, label, color }) => {
                const v = stats.foodLog.bySource[key];
                const pct = totalFoodBySource > 0 ? Math.round((v / totalFoodBySource) * 100) : 0;
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{label}</span>
                      <span className="text-muted-foreground">{v} <span className="text-xs">({pct}%)</span></span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">{stats.foodLog.total} total log entries</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Engagement metrics</p>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg food logs / user</span>
                  <span className="font-semibold">
                    {stats.users.total > 0 ? (stats.foodLog.total / stats.users.total).toFixed(1) : "—"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg check-ins / user</span>
                  <span className="font-semibold">
                    {stats.users.total > 0 ? (stats.checkIns.total / stats.users.total).toFixed(1) : "—"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg meal plans / user</span>
                  <span className="font-semibold">
                    {stats.users.total > 0 ? (stats.mealPlans.total / stats.users.total).toFixed(1) : "—"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Onboarding completion</span>
                  <span className="font-semibold">{stats.users.onboardRate}%</span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">AI feature adoption</p>
              <div className="space-y-3">
                {[
                  { label: "Used AI photo log", value: Math.min(stats.foodLog.bySource.vision, stats.users.total), total: stats.users.total, color: "bg-violet-400" },
                  { label: "Used voice log", value: Math.min(stats.foodLog.bySource.voice, stats.users.total), total: stats.users.total, color: "bg-pink-400" },
                  { label: "Generated meal plan", value: Math.min(stats.mealPlans.total, stats.users.total), total: stats.users.total, color: "bg-amber-400" },
                ].map(({ label, value, total, color }) => (
                  <div key={label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-semibold">{value} uses</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── AI COSTS TAB ── */}
      {tab === "costs" && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
            <p className="font-semibold mb-1">Estimated costs — not billed amounts</p>
            <p>{stats.aiCosts.note} Estimates use per-call averages; actual token usage varies.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Est. Total Cost"
              value={`$${stats.aiCosts.total.toFixed(2)}`}
              sub="all-time estimate"
              icon={DollarSign}
              iconColor="bg-green-50 text-green-500"
            />
            <StatCard
              label="Photo Analysis"
              value={`$${stats.aiCosts.estimated.vision.toFixed(2)}`}
              sub={`${stats.foodLog.bySource.vision} calls × $0.008`}
              icon={Camera}
              iconColor="bg-violet-50 text-violet-500"
            />
            <StatCard
              label="Voice Analysis"
              value={`$${stats.aiCosts.estimated.voice.toFixed(2)}`}
              sub={`${stats.foodLog.bySource.voice} calls × $0.003`}
              icon={Mic}
              iconColor="bg-pink-50 text-pink-500"
            />
            <StatCard
              label="Meal Plans"
              value={`$${stats.aiCosts.estimated.mealPlans.toFixed(2)}`}
              sub={`${stats.mealPlans.total} calls × $0.025`}
              icon={UtensilsCrossed}
              iconColor="bg-amber-50 text-amber-500"
            />
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-5">Cost breakdown by feature</p>
            <div className="space-y-4">
              {[
                {
                  label: "GPT-4o — Meal plan generation",
                  cost: stats.aiCosts.estimated.mealPlans,
                  calls: stats.mealPlans.total,
                  rate: "$0.025/call",
                  color: "bg-amber-400",
                  note: "~1,200 input + 2,000 output tokens avg",
                },
                {
                  label: "GPT-4o — Photo food recognition",
                  cost: stats.aiCosts.estimated.vision,
                  calls: stats.foodLog.bySource.vision,
                  rate: "$0.008/call",
                  color: "bg-violet-400",
                  note: "Image (low detail) + structured JSON response",
                },
                {
                  label: "GPT-4o — Voice food recognition",
                  cost: stats.aiCosts.estimated.voice,
                  calls: stats.foodLog.bySource.voice,
                  rate: "$0.003/call",
                  color: "bg-pink-400",
                  note: "Short text prompt + structured JSON response",
                },
                {
                  label: "Claude Sonnet — AI Coach",
                  cost: null,
                  calls: null,
                  rate: "~$0.005/exchange",
                  color: "bg-blue-400",
                  note: "Messages not individually tracked",
                },
              ].map(({ label, cost, calls, rate, color, note }) => (
                <div key={label} className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground">{note} · {rate}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-lg">
                        {cost !== null ? `$${cost.toFixed(2)}` : "—"}
                      </p>
                      {calls !== null && (
                        <p className="text-xs text-muted-foreground">{calls} calls</p>
                      )}
                    </div>
                  </div>
                  {cost !== null && stats.aiCosts.total > 0 && (
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${color}`}
                        style={{ width: `${Math.round((cost / stats.aiCosts.total) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-border mt-5 pt-4 flex justify-between items-center">
              <span className="text-sm font-bold">Total estimated (tracked features)</span>
              <span className="text-2xl font-black text-primary">${stats.aiCosts.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Cost per user</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-3xl font-black text-foreground">
                  ${stats.users.total > 0 ? (stats.aiCosts.total / stats.users.total).toFixed(3) : "0.000"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">avg AI cost per registered user</p>
              </div>
              <div>
                <p className="text-3xl font-black text-foreground">
                  ${stats.users.onboarded > 0 ? (stats.aiCosts.total / stats.users.onboarded).toFixed(3) : "0.000"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">avg AI cost per active user</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LIMITS TAB ── */}
      {tab === "limits" && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800 flex gap-3">
            <Info size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">How limits work</p>
              <p className="mt-0.5">Set to <strong>0</strong> for unlimited. Daily limits reset at midnight UTC. Monthly limits reset on the 1st of each month. Changes take effect immediately — no restart needed.</p>
            </div>
          </div>

          {limitsForm && proLimitsForm ? (
            <>
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <p className="font-bold">Free Tier Limits</p>
                <p className="text-xs text-muted-foreground mt-0.5">Per-user limits for free accounts</p>
              </div>

              <div className="divide-y divide-border">
                {([
                  {
                    key: "mealPlansPerMonth" as keyof LimitConfig,
                    label: "Meal Plan Generations",
                    period: "per month",
                    icon: UtensilsCrossed,
                    iconColor: "bg-amber-50 text-amber-500",
                    cost: "$0.025/call",
                    desc: "GPT-4o generates a full 7-day plan",
                  },
                  {
                    key: "photoLogsPerDay" as keyof LimitConfig,
                    label: "AI Photo Food Logs",
                    period: "per day",
                    icon: Camera,
                    iconColor: "bg-violet-50 text-violet-500",
                    cost: "$0.008/call",
                    desc: "GPT-4o vision analyzes a meal photo",
                  },
                  {
                    key: "voiceLogsPerDay" as keyof LimitConfig,
                    label: "AI Voice Food Logs",
                    period: "per day",
                    icon: Mic,
                    iconColor: "bg-pink-50 text-pink-500",
                    cost: "$0.003/call",
                    desc: "GPT-4o parses a spoken food description",
                  },
                  {
                    key: "coachMessagesPerDay" as keyof LimitConfig,
                    label: "AI Coach Messages",
                    period: "per day",
                    icon: TrendingUp,
                    iconColor: "bg-blue-50 text-blue-500",
                    cost: "~$0.005/exchange",
                    desc: "Claude Sonnet streaming coach response",
                  },
                  {
                    key: "workoutGenerationsPerMonth" as keyof LimitConfig,
                    label: "Workout Plan Generations",
                    period: "per month",
                    icon: Dumbbell,
                    iconColor: "bg-emerald-50 text-emerald-500",
                    cost: "~$0.05/call",
                    desc: "Claude Sonnet generates a full 7-day workout plan",
                  },
                ]).map(({ key, label, period, icon: Icon, iconColor, cost, desc }) => {
                  const current = limits?.[key] ?? 0;
                  const draft = limitsForm[key];
                  const changed = draft !== current;
                  return (
                    <div key={key} className="flex items-center gap-4 px-6 py-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{label}</p>
                          {changed && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">unsaved</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{desc} · <span className="text-primary font-medium">{cost}</span></p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="relative">
                          <Input
                            type="number"
                            min={0}
                            max={9999}
                            className="w-24 text-center font-bold"
                            value={draft}
                            onChange={(e) => setLimitsForm({ ...limitsForm, [key]: Number(e.target.value) || 0 })}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-20">{period}</span>
                        <span className="text-xs text-muted-foreground w-16 text-right">
                          {draft === 0 ? <span className="text-green-600 font-semibold">unlimited</span> : null}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <p className="font-bold">Pro Tier Limits</p>
                <p className="text-xs text-muted-foreground mt-0.5">Per-user limits for Pro subscribers</p>
              </div>

              <div className="divide-y divide-border">
                {([
                  { key: "mealPlansPerMonth" as keyof LimitConfig, label: "Meal Plan Generations", period: "per month" },
                  { key: "photoLogsPerDay" as keyof LimitConfig, label: "AI Photo Food Logs", period: "per day" },
                  { key: "voiceLogsPerDay" as keyof LimitConfig, label: "AI Voice Food Logs", period: "per day" },
                  { key: "coachMessagesPerDay" as keyof LimitConfig, label: "AI Coach Messages", period: "per day" },
                  { key: "workoutGenerationsPerMonth" as keyof LimitConfig, label: "Workout Plan Generations", period: "per month" },
                ]).map(({ key, label, period }) => {
                  const current = proLimits?.[key] ?? 0;
                  const draft = proLimitsForm[key];
                  const changed = draft !== current;
                  return (
                    <div key={`pro-${key}`} className="flex items-center gap-4 px-6 py-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{label}</p>
                          {changed && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">unsaved</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Input
                          type="number"
                          min={0}
                          max={9999}
                          className="w-24 text-center font-bold"
                          value={draft}
                          onChange={(e) => setProLimitsForm({ ...proLimitsForm, [key]: Number(e.target.value) || 0 })}
                        />
                        <span className="text-xs text-muted-foreground w-20">{period}</span>
                        <span className="text-xs text-muted-foreground w-16 text-right">
                          {draft === 0 ? <span className="text-green-600 font-semibold">unlimited</span> : null}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-muted/20">
                <p className="text-xs text-muted-foreground">
                  Pro limits apply to active and trialing subscribers.
                </p>
                <Button
                  onClick={saveLimits}
                  disabled={savingLimits || (JSON.stringify(limitsForm) === JSON.stringify(limits) && JSON.stringify(proLimitsForm) === JSON.stringify(proLimits))}
                  className="gap-2"
                >
                  {savingLimits ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : limitsSaved ? (
                    <>✓ Saved</>
                  ) : (
                    <><Save size={14} /> Save limits</>
                  )}
                </Button>
              </div>
            </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-muted-foreground" size={24} />
            </div>
          )}

          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Current period usage snapshot</p>
            <p className="text-xs text-muted-foreground">Across all users, this period</p>
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Meal plans this month", value: stats.mealPlans.last30, limit: limitsForm?.mealPlansPerMonth },
                  { label: "Photo logs today", value: "—", limit: limitsForm?.photoLogsPerDay },
                  { label: "Voice logs today", value: "—", limit: limitsForm?.voiceLogsPerDay },
                  { label: "Coach messages today", value: "—", limit: limitsForm?.coachMessagesPerDay },
                ].map(({ label, value, limit }) => (
                  <div key={label} className="bg-muted/40 border border-border rounded-xl p-3 text-center">
                    <p className="text-2xl font-black">{value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                    <p className="text-xs text-primary mt-1">limit: {limit === 0 ? "∞" : limit}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── GUIDES TAB ── */}
      {tab === "guides" && (
        <div className="space-y-6">
          {/* Editor panel */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <p className="font-bold text-sm">{editingGuide ? `Editing: ${editingGuide.title}` : "New Guide"}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setGuidePreview(!guidePreview)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg px-2.5 py-1.5"
                >
                  {guidePreview ? <EyeOff size={12} /> : <Eye size={12} />}
                  {guidePreview ? "Edit" : "Preview"}
                </button>
                {editingGuide && (
                  <button
                    type="button"
                    onClick={() => { setEditingGuide(null); setGuideForm(BLANK_GUIDE); }}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X size={12} /> Cancel
                  </button>
                )}
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex gap-3">
                <div className="w-16">
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Emoji</label>
                  <Input
                    value={guideForm.emoji}
                    onChange={(e) => setGuideForm({ ...guideForm, emoji: e.target.value })}
                    className="text-center text-xl"
                    maxLength={2}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Title *</label>
                  <Input
                    value={guideForm.title}
                    onChange={(e) => setGuideForm({ ...guideForm, title: e.target.value })}
                    placeholder="Guide title"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Summary</label>
                <Input
                  value={guideForm.summary}
                  onChange={(e) => setGuideForm({ ...guideForm, summary: e.target.value })}
                  placeholder="Short description shown in the guide list"
                />
              </div>

              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Category</label>
                  <Input
                    value={guideForm.category}
                    onChange={(e) => setGuideForm({ ...guideForm, category: e.target.value })}
                    placeholder="e.g. Nutrition, Training"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer pb-2">
                  <input
                    type="checkbox"
                    checked={guideForm.published}
                    onChange={(e) => setGuideForm({ ...guideForm, published: e.target.checked })}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm font-semibold">Published</span>
                </label>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Tags</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {guideForm.tags.map((t) => (
                    <span key={t} className="flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full">
                      {t}
                      <button type="button" onClick={() => setGuideForm({ ...guideForm, tags: guideForm.tags.filter((x) => x !== t) })}>
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={guideTagInput}
                    onChange={(e) => setGuideTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                    placeholder="Add tag and press Enter"
                    className="text-xs"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addTag}>Add</Button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Content (Markdown)
                </label>
                {guidePreview ? (
                  <div className="min-h-64 border border-border rounded-xl p-4 bg-muted/20 prose prose-sm max-w-none prose-headings:font-bold prose-headings:text-foreground prose-p:text-foreground/80 overflow-auto">
                    {guideForm.content ? (
                      <ReactMarkdown>{guideForm.content}</ReactMarkdown>
                    ) : (
                      <p className="text-muted-foreground italic">Nothing to preview yet.</p>
                    )}
                  </div>
                ) : (
                  <textarea
                    value={guideForm.content}
                    onChange={(e) => setGuideForm({ ...guideForm, content: e.target.value })}
                    className="w-full min-h-64 border border-border rounded-xl p-4 text-sm font-mono bg-muted/10 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
                    placeholder={`# Guide Title\n\nWrite your guide in **Markdown**.\n\n## Section\n\nParagraph text here.`}
                    spellCheck={false}
                  />
                )}
              </div>

              {/* AI Assistance panel */}
              <div className="border border-primary/20 rounded-xl bg-primary/5 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setAiOpen(!aiOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles size={15} />
                    AI Writing Assistant
                  </span>
                  {aiOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {aiOpen && (
                  <div className="px-4 pb-4 space-y-3 border-t border-primary/10">
                    {/* Quick actions */}
                    <div className="flex flex-wrap gap-2 pt-3">
                      <button
                        type="button"
                        disabled={aiStreaming || !guideForm.title.trim()}
                        onClick={() => runAi("generate")}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Wand2 size={12} />
                        Generate draft
                      </button>
                      <button
                        type="button"
                        disabled={aiStreaming || !guideForm.content.trim()}
                        onClick={() => runAi("improve")}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-card border border-border text-foreground hover:bg-muted/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Sparkles size={12} />
                        Improve writing
                      </button>
                    </div>

                    {/* Custom instruction */}
                    <div className="flex gap-2">
                      <Input
                        value={aiInstruction}
                        onChange={(e) => setAiInstruction(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && aiInstruction.trim()) { e.preventDefault(); runAi("custom"); } }}
                        placeholder='Custom instruction, e.g. "add a section on meal timing" or "simplify for beginners"'
                        className="text-xs flex-1"
                        disabled={aiStreaming}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={aiStreaming || !aiInstruction.trim()}
                        onClick={() => runAi("custom")}
                        className="shrink-0"
                      >
                        {aiStreaming ? <Loader2 size={12} className="animate-spin" /> : "Run"}
                      </Button>
                    </div>

                    {/* Streaming output */}
                    {(aiStreaming || aiDraft) && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                            {aiStreaming && <Loader2 size={11} className="animate-spin" />}
                            {aiStreaming ? "Writing…" : "AI draft ready"}
                          </p>
                          {!aiStreaming && aiDraft && (
                            <button
                              type="button"
                              onClick={applyAiDraft}
                              className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-lg hover:bg-green-100 transition-colors"
                            >
                              <Check size={11} /> Apply to editor
                            </button>
                          )}
                        </div>
                        <div className="max-h-80 overflow-y-auto border border-border rounded-lg bg-card p-3 prose prose-sm max-w-none prose-headings:font-bold prose-headings:text-foreground prose-p:text-foreground/80 prose-li:text-foreground/80">
                          <ReactMarkdown>{aiDraft || " "}</ReactMarkdown>
                        </div>
                        {!aiStreaming && aiDraft && (
                          <p className="text-xs text-muted-foreground">Review the draft above, then click <strong>Apply to editor</strong> to replace your current content — or keep editing manually.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={saveGuide} disabled={guideSaving || !guideForm.title.trim()} className="gap-2">
                  {guideSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {editingGuide ? "Save changes" : "Create guide"}
                </Button>
              </div>
            </div>
          </div>

          {/* Guide list */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <p className="font-bold text-sm">All Guides</p>
              <button
                type="button"
                onClick={openNewGuide}
                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-semibold"
              >
                <Plus size={14} /> New guide
              </button>
            </div>

            {guidesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-muted-foreground" size={24} />
              </div>
            ) : guides.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No guides yet. Create the first one above.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {guides.map((g) => (
                  <div key={g._id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors">
                    <span className="text-2xl shrink-0">{g.emoji || "📖"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate">{g.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${g.published ? "bg-green-50 text-green-700 border border-green-200" : "bg-muted text-muted-foreground border border-border"}`}>
                          {g.published ? "Published" : "Draft"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{g.summary || <em>No summary</em>}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditGuide(g)}
                        className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteGuide(g.slug, g.title)}
                        disabled={guideDeletingSlug === g.slug}
                        className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        {guideDeletingSlug === g.slug ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
