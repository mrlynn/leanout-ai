"use client";

import { useEffect, useState } from "react";
import { BADGE_MAP } from "@/lib/gamification";
import { X, Zap, Flame, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareMilestoneCard } from "@/components/ShareMilestoneCard";

interface CompletedQuest {
  id: string;
  name: string;
  xpReward: number;
}

interface Reward {
  xpGained: number;
  newBadges: string[];
  newStreak: number;
  leveledUp: boolean;
  newLevel: number;
  freezeUsed?: boolean;
  completedQuests?: CompletedQuest[];
}

export function CheckInCelebration({ reward, onClose }: { reward: Reward; onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  const quests = reward.completedQuests ?? [];

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  function close() {
    setVisible(false);
    setTimeout(onClose, 300);
  }

  const headerSubtitle = reward.freezeUsed
    ? `Streak freeze used — ${reward.newStreak} days alive!`
    : reward.leveledUp
      ? "Level up!"
      : "Check-in complete";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 transition-all duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={close}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className={`relative bg-white rounded-3xl w-full max-w-sm card-shadow-md overflow-hidden transition-all duration-300 ${
          visible ? "translate-y-0 scale-100" : "translate-y-8 scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="gradient-orange px-6 pt-8 pb-6 text-center">
          <button onClick={close} className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors">
            <X size={16} className="text-white" />
          </button>

          {reward.leveledUp ? (
            <>
              <div className="text-5xl mb-2">🎉</div>
              <p className="text-orange-200 text-sm font-medium">{headerSubtitle}</p>
              <p className="text-white font-black text-3xl tracking-tight">Level {reward.newLevel}</p>
            </>
          ) : (
            <>
              <div className="text-4xl mb-2">{reward.freezeUsed ? "🛡️" : "✅"}</div>
              <p className="text-orange-200 text-sm font-medium">{headerSubtitle}</p>
              <p className="text-white font-black text-2xl tracking-tight">
                {reward.freezeUsed ? "Streak saved!" : "Great work!"}
              </p>
            </>
          )}
        </div>

        <div className="grid grid-cols-3 divide-x divide-muted border-b border-muted">
          <div className="py-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Zap size={14} className="text-primary" />
              <p className="font-black text-lg text-primary">+{reward.xpGained}</p>
            </div>
            <p className="text-xs text-muted-foreground">XP earned</p>
          </div>
          <div className="py-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Flame size={14} className="text-orange-500" />
              <p className="font-black text-lg">{reward.newStreak}</p>
            </div>
            <p className="text-xs text-muted-foreground">day streak</p>
          </div>
          <div className="py-4 text-center">
            <p className="font-black text-lg">{reward.newBadges.length + quests.length}</p>
            <p className="text-xs text-muted-foreground">unlock{reward.newBadges.length + quests.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {reward.newBadges.length > 0 && (
          <div className="px-6 py-5 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Badge{reward.newBadges.length > 1 ? "s" : ""} unlocked
            </p>
            <div className="space-y-2">
              {reward.newBadges.map((id) => {
                const badge = BADGE_MAP[id];
                if (!badge) return null;
                return (
                  <div key={id} className="flex items-center gap-3 bg-orange-50 rounded-2xl px-4 py-3 border border-orange-100">
                    <span className="text-2xl">{badge.emoji}</span>
                    <div>
                      <p className="font-bold text-sm">{badge.name}</p>
                      <p className="text-xs text-muted-foreground">{badge.description}</p>
                    </div>
                    {badge.xpReward > 0 && (
                      <span className="ml-auto text-xs font-bold text-primary">+{badge.xpReward} XP</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {quests.length > 0 && (
          <div className="px-6 py-5 space-y-3 border-t border-muted">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Quest{quests.length > 1 ? "s" : ""} complete
            </p>
            <div className="space-y-2">
              {quests.map((q) => (
                <div key={q.id} className="flex items-center gap-3 bg-violet-50 rounded-2xl px-4 py-3 border border-violet-100">
                  <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                    <Swords size={14} className="text-violet-600" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{q.name}</p>
                    <p className="text-xs text-muted-foreground">Weekly quest complete</p>
                  </div>
                  <span className="ml-auto text-xs font-bold text-violet-700">+{q.xpReward} XP</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(reward.newBadges.length > 0 || reward.leveledUp) && (
          <div className="px-6 py-4 border-t border-muted">
            <ShareMilestoneCard
              title={reward.leveledUp ? `Level ${reward.newLevel}` : BADGE_MAP[reward.newBadges[0]]?.name ?? "Milestone"}
              subtitle={reward.leveledUp ? "Level up unlocked" : "Badge earned"}
              stat={reward.leveledUp ? String(reward.newLevel) : `+${reward.xpGained}`}
              statLabel={reward.leveledUp ? "New level" : "XP this check-in"}
            />
          </div>
        )}

        <div className="px-6 pb-6 pt-2">
          <Button onClick={close} className="w-full rounded-2xl h-11 gradient-orange border-0 hover:opacity-90 font-bold">
            Keep it up →
          </Button>
        </div>
      </div>
    </div>
  );
}
