"use client";

import { useEffect, useState } from "react";
import { Flame, Zap, Trophy } from "lucide-react";
import Link from "next/link";

interface GamStats {
  xp: number;
  level: number;
  xpCurrent: number;
  xpNeeded: number;
  xpPct: number;
  currentStreak: number;
  longestStreak: number;
  earnedCount: number;
  totalBadges: number;
}

export function GamificationCard() {
  const [stats, setStats] = useState<GamStats | null>(null);

  useEffect(() => {
    fetch("/api/gamification")
      .then((r) => r.json())
      .then((d) => setStats(d));
  }, []);

  if (!stats) return null;

  return (
    <Link href="/progress#achievements">
      <div className="bg-white rounded-3xl card-shadow p-5 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Your progress</p>
          <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1 rounded-full">
            <Zap size={12} className="text-primary" fill="currentColor" />
            <span className="text-xs font-black text-primary">{stats.xp.toLocaleString()} XP</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* Level */}
          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl gradient-orange flex items-center justify-center mx-auto mb-1.5">
              <span className="text-white font-black text-lg">{stats.level}</span>
            </div>
            <p className="text-xs text-muted-foreground">Level</p>
          </div>
          {/* Streak */}
          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-1.5">
              <Flame size={22} className={stats.currentStreak > 0 ? "text-orange-500" : "text-muted-foreground"} />
            </div>
            <p className="text-xs font-black">{stats.currentStreak}d</p>
            <p className="text-xs text-muted-foreground">streak</p>
          </div>
          {/* Badges */}
          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-1.5">
              <Trophy size={20} className="text-purple-500" />
            </div>
            <p className="text-xs font-black">{stats.earnedCount}/{stats.totalBadges}</p>
            <p className="text-xs text-muted-foreground">badges</p>
          </div>
        </div>

        {/* XP bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Level {stats.level}</span>
            <span>{stats.xpCurrent} / {stats.xpNeeded} XP to Level {stats.level + 1}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full gradient-orange rounded-full transition-all duration-700"
              style={{ width: `${stats.xpPct}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
