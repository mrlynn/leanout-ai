"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
  Area,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Flame, Zap, Trophy } from "lucide-react";
import { ProgressPhotos } from "@/components/ProgressPhotos";
import { WeeklyReviewCard } from "@/components/WeeklyReviewCard";
import { MacroAdjustmentCard } from "@/components/MacroAdjustmentCard";

interface CheckIn {
  date: string;
  weightLbs: number;
  compliance: number;
  energy: number;
  hunger: number;
  steps?: number;
  workoutCompleted: boolean;
}

interface UserStats {
  weightLbs: number;
  bodyFatPercent: number;
  goalWeightLbs?: number;
  weeksToGoal?: number;
}

function weeklyAverage(data: CheckIn[]): { week: string; weight: number; compliance: number }[] {
  const byWeek: Record<string, number[]> = {};
  const compByWeek: Record<string, number[]> = {};

  data.forEach((c) => {
    const d = new Date(c.date);
    // ISO week key: year-week
    const day = d.getDay() || 7;
    d.setDate(d.getDate() + 4 - day);
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    const key = `W${weekNo}`;
    if (!byWeek[key]) byWeek[key] = [];
    if (!compByWeek[key]) compByWeek[key] = [];
    byWeek[key].push(c.weightLbs);
    compByWeek[key].push(c.compliance);
  });

  return Object.entries(byWeek)
    .map(([week, weights]) => ({
      week,
      weight: Math.round((weights.reduce((a, b) => a + b, 0) / weights.length) * 10) / 10,
      compliance: Math.round((compByWeek[week].reduce((a, b) => a + b, 0) / compByWeek[week].length) * 10) / 10,
    }))
    .reverse();
}

interface GamBadge { id: string; name: string; description: string; emoji: string; xpReward: number; earned: boolean; }
interface GamStats {
  xp: number; level: number; xpCurrent: number; xpNeeded: number; xpPct: number;
  currentStreak: number; longestStreak: number; earnedCount: number; totalBadges: number;
  badges: GamBadge[];
}

interface AdherenceData {
  proteinHitRate: number;
  calorieHitRate: number;
  loggedDays: number;
  daily: { date: string; calories: number; protein: number; proteinPct: number; logged: boolean }[];
}

export interface ProgressViewProps {
  checkIns: CheckIn[];
  stats: UserStats | null;
  gam: GamStats | null;
  adherence?: AdherenceData | null;
  estimatedExpenditure?: number | null;
  isPro?: boolean;
}

export function ProgressView({ checkIns, stats, gam, adherence, estimatedExpenditure, isPro = false }: ProgressViewProps) {

  const chartData = checkIns.map((c) => ({
    date: new Date(c.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    weight: c.weightLbs,
    compliance: c.compliance,
    energy: c.energy,
    steps: c.steps,
  }));

  const weekly = weeklyAverage([...checkIns].reverse());

  const totalCheckIns = checkIns.length;
  const avgCompliance =
    totalCheckIns > 0
      ? (checkIns.reduce((s, c) => s + c.compliance, 0) / totalCheckIns).toFixed(1)
      : "—";
  const workoutsLogged = checkIns.filter((c) => c.workoutCompleted).length;
  const startWeight = checkIns[0]?.weightLbs;
  const currentWeight = checkIns[checkIns.length - 1]?.weightLbs;
  const totalLost = startWeight && currentWeight ? (startWeight - currentWeight).toFixed(1) : null;

  // Simple linear goal projection
  const goalWeight = stats?.goalWeightLbs;
  let projectionLine: { date: string; projected: number }[] = [];
  if (chartData.length >= 3 && goalWeight) {
    const recent = checkIns.slice(-7);
    const weeklyChange =
      (recent[recent.length - 1].weightLbs - recent[0].weightLbs) / (recent.length / 7);
    const last = chartData[chartData.length - 1];
    const lastWeight = checkIns[checkIns.length - 1].weightLbs;
    projectionLine = Array.from({ length: 8 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + (i + 1) * 7);
      return {
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        projected: Math.max(goalWeight, Math.round((lastWeight + weeklyChange * (i + 1)) * 10) / 10),
      };
    });
    void last; // suppress unused warning
  }

  const combinedData = [
    ...chartData.map((d) => ({ ...d, projected: undefined })),
    ...projectionLine.map((d) => ({ ...d, weight: undefined, compliance: undefined, energy: undefined, steps: undefined })),
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-orange px-6 pt-10 pb-14 md:pt-12">
        <div className="max-w-4xl mx-auto">
          <p className="text-orange-200 text-sm font-medium">Your journey</p>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">Progress</h1>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 -mt-6 pb-10 space-y-5">
        {checkIns.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <p className="text-lg font-medium">No check-ins yet</p>
            <p className="text-sm text-muted-foreground">Start logging daily check-ins to see your progress here.</p>
            <a href="/check-in" className="text-primary underline text-sm">Go to check-in →</a>
          </div>
        ) : (
          <>
            {adherence && (
              <div className="bg-white rounded-3xl card-shadow p-5">
                <p className="font-bold text-sm mb-4">Nutrition adherence (7 days)</p>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-2xl font-black text-primary">{adherence.proteinHitRate}%</p>
                    <p className="text-xs text-muted-foreground">Protein on target</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black">{adherence.calorieHitRate}%</p>
                    <p className="text-xs text-muted-foreground">Calories in range</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black">{adherence.loggedDays}/7</p>
                    <p className="text-xs text-muted-foreground">Days logged</p>
                  </div>
                </div>
                {estimatedExpenditure && (
                  <p className="text-sm text-muted-foreground border-t border-border pt-3">
                    Estimated expenditure from your logs: <span className="font-bold text-foreground">{estimatedExpenditure} kcal/day</span>
                  </p>
                )}
              </div>
            )}

            <WeeklyReviewCard isPro={isPro} />
            <MacroAdjustmentCard isPro={isPro} />

            <div className="bg-white rounded-3xl card-shadow p-5">
              <ProgressPhotos />
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Check-ins logged", value: totalCheckIns, unit: "days" },
                { label: "Total lost", value: totalLost ? `${parseFloat(totalLost) > 0 ? totalLost : "0"}` : "—", unit: "lbs" },
                { label: "Avg compliance", value: avgCompliance, unit: "/ 10" },
                { label: "Workouts logged", value: workoutsLogged, unit: "sessions" },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-2xl card-shadow p-4">
                  <p className="text-2xl font-black tracking-tight">{s.value}<span className="text-sm font-medium text-muted-foreground ml-1">{s.unit}</span></p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Weight trend chart */}
            <div className="bg-white rounded-3xl card-shadow overflow-hidden">
              <div className="px-6 pt-5 pb-2">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm">Weight trend</p>
                  {goalWeight && (
                    <Badge variant="outline">Goal: {goalWeight} lbs</Badge>
                  )}
                </div>
              </div>
              <div className="px-6 pb-5">
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={combinedData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} interval="preserveStartEnd" />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      domain={["auto", "auto"]}
                    />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      formatter={(v, name) => [
                        `${v} lbs`,
                        name === "projected" ? "Projected" : "Weight",
                      ]}
                    />
                    {goalWeight && (
                      <ReferenceLine y={goalWeight} stroke="hsl(var(--primary))" strokeDasharray="4 4" label={{ value: "Goal", fontSize: 11 }} />
                    )}
                    <Area
                      type="monotone"
                      dataKey="weight"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#weightGrad)"
                      dot={false}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="projected"
                      stroke="hsl(var(--primary))"
                      strokeWidth={1.5}
                      strokeDasharray="5 5"
                      dot={false}
                      connectNulls
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weekly averages */}
            {weekly.length > 1 && (
              <div className="bg-white rounded-3xl card-shadow overflow-hidden">
                <div className="px-6 pt-5 pb-2">
                  <p className="font-bold text-sm">Weekly averages</p>
                </div>
                <div className="px-6 pb-5">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-muted-foreground border-b">
                          <th className="pb-2">Week</th>
                          <th className="pb-2 text-right">Avg weight</th>
                          <th className="pb-2 text-right">Change</th>
                          <th className="pb-2 text-right">Compliance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {weekly.map((w, i) => {
                          const change = i < weekly.length - 1 ? (w.weight - weekly[i + 1].weight).toFixed(1) : null;
                          const isLoss = change && parseFloat(change) < 0;
                          return (
                            <tr key={w.week} className="border-b last:border-0">
                              <td className="py-2">{w.week}</td>
                              <td className="py-2 text-right font-medium">{w.weight} lbs</td>
                              <td className={`py-2 text-right font-medium ${isLoss ? "text-green-600" : change && parseFloat(change) > 0 ? "text-red-500" : "text-muted-foreground"}`}>
                                {change ? (parseFloat(change) > 0 ? `+${change}` : change) : "—"} lbs
                              </td>
                              <td className="py-2 text-right">{w.compliance}/10</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Adherence & energy chart */}
            <div className="bg-white rounded-3xl card-shadow overflow-hidden">
              <div className="px-6 pt-5 pb-2">
                <p className="font-bold text-sm">Adherence &amp; energy</p>
              </div>
              <div className="px-6 pb-5">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} domain={[0, 10]} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Line type="monotone" dataKey="compliance" stroke="#3b82f6" strokeWidth={2} dot={false} name="Compliance" />
                    <Line type="monotone" dataKey="energy" stroke="#f59e0b" strokeWidth={2} dot={false} name="Energy" />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-2 justify-center text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-blue-500" /> Compliance</span>
                  <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-yellow-500" /> Energy</span>
                </div>
              </div>
            </div>

            {/* Steps chart */}
            {chartData.some((d) => d.steps) && (
              <div className="bg-white rounded-3xl card-shadow overflow-hidden">
                <div className="px-6 pt-5 pb-2">
                  <p className="font-bold text-sm">Daily steps</p>
                </div>
                <div className="px-6 pb-5">
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="stepsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [`${Number(v).toLocaleString()}`, "Steps"]} />
                      <Area type="monotone" dataKey="steps" stroke="#10b981" strokeWidth={2} fill="url(#stepsGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Achievements */}
            {gam && (
              <div id="achievements" className="space-y-4">
                {/* Level + streak header */}
                <div className="bg-white rounded-3xl card-shadow overflow-hidden">
                  <div className="gradient-orange px-6 py-5 flex items-center justify-between">
                    <div>
                      <p className="text-orange-200 text-xs font-bold uppercase tracking-widest">Current level</p>
                      <p className="text-white font-black text-4xl tracking-tight">Level {gam.level}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 justify-end mb-1">
                        <Flame size={16} className="text-orange-200" />
                        <p className="text-white font-black text-2xl">{gam.currentStreak}</p>
                      </div>
                      <p className="text-orange-200 text-xs">day streak</p>
                      <p className="text-orange-300 text-xs">best: {gam.longestStreak}d</p>
                    </div>
                  </div>
                  <div className="px-6 py-4 space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Zap size={11} className="text-primary" /> {gam.xp.toLocaleString()} XP total</span>
                      <span>{gam.xpCurrent} / {gam.xpNeeded} XP to Level {gam.level + 1}</span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full gradient-orange rounded-full transition-all duration-700" style={{ width: `${gam.xpPct}%` }} />
                    </div>
                  </div>
                </div>

                {/* Badge grid */}
                <div className="bg-white rounded-3xl card-shadow p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-black text-base">Achievements</p>
                    <div className="flex items-center gap-1.5 bg-purple-50 px-3 py-1 rounded-full">
                      <Trophy size={12} className="text-purple-500" />
                      <span className="text-xs font-bold text-purple-700">{gam.earnedCount} / {gam.totalBadges}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {gam.badges.map((badge) => (
                      <div key={badge.id} className={`rounded-2xl p-3 border-2 transition-all ${
                        badge.earned
                          ? "border-orange-200 bg-orange-50"
                          : "border-border bg-muted/30 opacity-50 grayscale"
                      }`}>
                        <div className="flex items-start gap-2.5">
                          <span className="text-2xl leading-none">{badge.emoji}</span>
                          <div className="min-w-0">
                            <p className="font-bold text-xs leading-tight">{badge.name}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{badge.description}</p>
                            {badge.xpReward > 0 && badge.earned && (
                              <span className="text-[10px] font-bold text-primary">+{badge.xpReward} XP</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
