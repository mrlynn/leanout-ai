"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Swords, ChevronRight } from "lucide-react";

interface QuestSummary {
  questId: string;
  name: string;
  xpReward: number;
  progress: number;
  target: number;
  completed: boolean;
}

interface QuestsResponse {
  weekStart: string;
  quests: QuestSummary[];
}

export function QuestsCard() {
  const [data, setData] = useState<QuestsResponse | null>(null);

  useEffect(() => {
    fetch("/api/gamification")
      .then((r) => r.json())
      .then((d) => {
        if (d.quests && d.weekStart) {
          setData({ weekStart: d.weekStart, quests: d.quests });
        }
      });
  }, []);

  if (!data || data.quests.length === 0) return null;

  const completedCount = data.quests.filter((q) => q.completed).length;
  const totalXP = data.quests.reduce((s, q) => s + q.xpReward, 0);

  return (
    <Link href="/progress#quests">
      <div className="bg-white rounded-3xl card-shadow p-5 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-violet-100 flex items-center justify-center">
              <Swords size={14} className="text-violet-600" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Weekly quests</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-violet-600">{completedCount}/{data.quests.length} done</span>
            <ChevronRight size={14} className="text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-3">
          {data.quests.map((q) => {
            const pct = q.target > 0 ? Math.min(100, Math.round((q.progress / q.target) * 100)) : 0;
            return (
              <div key={q.questId}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-semibold ${q.completed ? "text-muted-foreground line-through" : ""}`}>
                    {q.completed ? "✓ " : ""}{q.name}
                  </span>
                  <span className="text-xs font-bold text-violet-600">+{q.xpReward} XP</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${q.completed ? "bg-green-500" : "bg-violet-500"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {q.progress} / {q.target}
                  {q.completed && " · Complete!"}
                </p>
              </div>
            );
          })}
        </div>

        {completedCount === data.quests.length && (
          <div className="mt-3 pt-3 border-t border-muted text-center">
            <span className="text-xs font-black text-green-600">Quest sweep! +{totalXP} XP earned 🎉</span>
          </div>
        )}
      </div>
    </Link>
  );
}
