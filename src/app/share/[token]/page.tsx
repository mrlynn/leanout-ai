"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Flame, CheckCircle2, XCircle, Loader2, Zap } from "lucide-react";

interface ShareData {
  name: string;
  currentStreak: number;
  longestStreak: number;
  checkedInToday: boolean;
  weekCompliance: number;
  weights: { date: string; weight: number }[];
  workoutsThisWeek: number;
}

export default function SharePage() {
  const params = useParams();
  const token = params.token as string;
  const [data, setData] = useState<ShareData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/share/${token}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "Failed to load");
        setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="text-center">
          <p className="font-bold text-lg">Link unavailable</p>
          <p className="text-sm text-muted-foreground mt-2">{error || "This share link has expired or been revoked."}</p>
        </div>
      </div>
    );
  }

  const minW = data.weights.length > 0 ? Math.min(...data.weights.map((w) => w.weight)) : 0;
  const maxW = data.weights.length > 0 ? Math.max(...data.weights.map((w) => w.weight)) : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-orange px-6 pt-10 pb-14">
        <div className="max-w-md mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg gradient-orange flex items-center justify-center ring-2 ring-white/30">
              <Zap size={14} className="text-white" fill="white" />
            </div>
            <span className="font-black text-white text-lg">LeanOut AI</span>
          </div>
          <h1 className="text-2xl font-black text-white">{data.name}&apos;s progress</h1>
          <p className="text-orange-200 text-sm mt-1">Accountability view · read only</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 -mt-6 pb-12 space-y-4">
        <div className="bg-white rounded-3xl card-shadow-md p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {data.checkedInToday ? (
                <CheckCircle2 size={20} className="text-green-600" />
              ) : (
                <XCircle size={20} className="text-red-500" />
              )}
              <span className="font-bold text-sm">
                {data.checkedInToday ? "Checked in today" : "Not checked in yet"}
              </span>
            </div>
            <div className="flex items-center gap-1 text-orange-600">
              <Flame size={16} />
              <span className="font-black text-lg">{data.currentStreak}</span>
              <span className="text-xs text-muted-foreground">day streak</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl card-shadow p-4">
            <p className="text-2xl font-black">{data.weekCompliance}%</p>
            <p className="text-xs text-muted-foreground">Avg compliance</p>
          </div>
          <div className="bg-white rounded-2xl card-shadow p-4">
            <p className="text-2xl font-black">{data.workoutsThisWeek}</p>
            <p className="text-xs text-muted-foreground">Workouts this week</p>
          </div>
        </div>

        {data.weights.length > 0 && (
          <div className="bg-white rounded-3xl card-shadow p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Weight trend</p>
            <div className="flex items-end gap-1 h-24">
              {data.weights.map((w) => {
                const range = maxW - minW || 1;
                const h = ((w.weight - minW) / range) * 80 + 20;
                return (
                  <div key={w.date} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-primary/80 rounded-t-md" style={{ height: `${h}%` }} />
                    <span className="text-[9px] text-muted-foreground">
                      {new Date(w.date).toLocaleDateString("en-US", { month: "numeric", day: "numeric" })}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Best streak: {data.longestStreak} days
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
