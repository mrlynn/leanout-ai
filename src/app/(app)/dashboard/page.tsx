import { GamificationCard } from "@/components/GamificationCard";
import { QuestsCard } from "@/components/QuestsCard";
import { CoachBriefCard } from "@/components/CoachBrief";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { physiqueFromUser, macrosFromUser } from "@/lib/physique";
import { aggregateDayTotals, getDateString } from "@/lib/foodLog";
import FoodLogEntry from "@/models/FoodLogEntry";
import { buildCoachingSnapshot, generateCoachBrief } from "@/lib/coachingContext";
import Link from "next/link";
import { UsageMeters } from "@/components/UsageMeters";
import { WeeklyReviewCard } from "@/components/WeeklyReviewCard";
import { isProActive } from "@/lib/billing";
import { PageContainer } from "@/components/PageContainer";
import { InstallAppBanner } from "@/components/InstallAppBanner";
import { AdaptiveTargetsCard } from "@/components/AdaptiveTargetsCard";
import { computeAdaptiveSignals } from "@/lib/adaptiveTargets";
import {
  Flame,
  Target,
  TrendingDown,
  UtensilsCrossed,
  Camera,
  ClipboardCheck,
  TrendingUp,
  MessageSquare,
  ChevronRight,
  Settings,
  Calendar,
} from "lucide-react";

function daysUntil(date?: Date | null) {
  if (!date) return null;
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / 86400000);
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();
  const user = await User.findById(session.user.id).lean();
  if (!user?.onboardingComplete) redirect("/onboarding");

  const physique = physiqueFromUser(user);
  const macros = macrosFromUser(user);
  const firstName = user.name?.split(" ")[0] ?? "there";

  const today = getDateString();
  const foodEntries = await FoodLogEntry.find({ userId: session.user.id, date: today }).lean();
  const intake = aggregateDayTotals(foodEntries);

  const snapshot = await buildCoachingSnapshot(session.user.id);
  const brief = snapshot ? generateCoachBrief(snapshot) : null;
  const adaptiveSignals = snapshot ? computeAdaptiveSignals(snapshot) : null;

  const goalDays = daysUntil(user.goalDate);
  const vacationDays = daysUntil(user.vacationDate);
  const isPro = isProActive(user.planTier, user.subscriptionStatus);

  const quickLinks = [
    { href: "/meal-plan", label: "Meal Plan", sub: "7-day AI plan", icon: UtensilsCrossed, color: "bg-orange-50 text-orange-600" },
    { href: "/food-log", label: "Food Log", sub: "Track intake", icon: Camera, color: "bg-rose-50 text-rose-600" },
    { href: "/check-in", label: "Check-in", sub: "Log today", icon: ClipboardCheck, color: "bg-blue-50 text-blue-600" },
    { href: "/progress", label: "Progress", sub: "Charts & trends", icon: TrendingUp, color: "bg-green-50 text-green-600" },
    { href: "/coach", label: "AI Coach", sub: "Chat with Claude", icon: MessageSquare, color: "bg-purple-50 text-purple-600" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-orange pt-10 pb-16 md:pt-12">
        <PageContainer>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-orange-200 text-sm font-medium mb-1">Good {getTimeOfDay()},</p>
              <h1 className="text-3xl font-black text-white tracking-tight">{firstName} 👊</h1>
            </div>
            <Link href="/settings" className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
              <Settings size={18} className="text-white" />
            </Link>
          </div>

          {physique && (
            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                { icon: Flame, value: physique.targetCalories, label: "kcal / day" },
                { icon: Target, value: physique.goalWeightLbs, label: "goal lbs" },
                { icon: TrendingDown, value: physique.weeksToGoal, label: "weeks out" },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                  <Icon size={16} className="text-orange-200 mb-2" />
                  <p className="stat-number text-white">{value}</p>
                  <p className="text-orange-200 text-xs mt-1 font-medium">{label}</p>
                </div>
              ))}
            </div>
          )}

          {(goalDays !== null && goalDays > 0) || (vacationDays !== null && vacationDays > 0) ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {goalDays !== null && goalDays > 0 && (
                <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                  <Calendar size={12} /> Goal in {goalDays}d
                </span>
              )}
              {vacationDays !== null && vacationDays > 0 && (
                <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                  <Calendar size={12} /> Vacation in {vacationDays}d
                </span>
              )}
            </div>
          ) : null}
        </PageContainer>
      </div>

      <PageContainer className="-mt-6 pb-10 space-y-5">
        <InstallAppBanner />
        {adaptiveSignals && macros && (
          <AdaptiveTargetsCard signals={adaptiveSignals} macros={macros} isPro={isPro} />
        )}
        {brief && <CoachBriefCard brief={brief} />}

        <UsageMeters />
        <WeeklyReviewCard isPro={isPro} />

        <QuestsCard />

        {macros && (
          <div className="bg-white rounded-3xl card-shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Daily macros</p>
              <Link href="/food-log" className="text-xs font-bold text-primary hover:underline">Log food</Link>
            </div>
            <div className="mb-4 pb-4 border-b border-muted">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-bold">Calories</span>
                <span className="text-sm">
                  <span className="font-black text-lg">{intake.calories}</span>
                  <span className="text-muted-foreground"> / {macros.calories}</span>
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.round((intake.calories / macros.calories) * 100))}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Protein", consumed: intake.protein, target: macros.proteinG, color: "text-blue-600", bg: "bg-blue-50", bar: "bg-blue-500" },
                { label: "Carbs", consumed: intake.carbs, target: macros.carbsG, color: "text-amber-600", bg: "bg-amber-50", bar: "bg-amber-400" },
                { label: "Fat", consumed: intake.fat, target: macros.fatG, color: "text-orange-600", bg: "bg-orange-50", bar: "bg-orange-500" },
              ].map((m) => (
                <div key={m.label} className="space-y-2">
                  <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold ${m.bg} ${m.color}`}>{m.label}</span>
                  <p className={`text-2xl font-black ${m.color} tracking-tight`}>
                    {m.consumed}<span className="text-sm font-semibold">g</span>
                    <span className="text-sm font-medium text-muted-foreground"> / {m.target}g</span>
                  </p>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${m.bar} rounded-full transition-all`}
                      style={{ width: `${m.target > 0 ? Math.min(100, Math.round((m.consumed / m.target) * 100)) : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {physique && (
          <div className="bg-white rounded-3xl card-shadow p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Body composition</p>
            <div className="grid grid-cols-2 gap-y-4">
              {[
                { label: "Lean mass", value: physique.leanBodyMassLbs },
                { label: "Fat mass", value: physique.fatMassLbs },
                { label: "Current weight", value: user.weightLbs },
                { label: "Weekly target", value: `−${physique.weeklyFatLossLbs}`, accent: true },
              ].map(({ label, value, accent }) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className={`text-2xl font-black tracking-tight ${accent ? "text-primary" : ""}`}>
                    {value}<span className="text-sm font-medium text-muted-foreground ml-1">lbs{label === "Weekly target" ? "/wk" : ""}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <GamificationCard />

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Your tools</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {quickLinks.map(({ href, label, sub, icon: Icon, color }) => (
              <Link key={href} href={href}>
                <div className="bg-white rounded-2xl card-shadow p-5 flex items-center justify-between group hover:shadow-md transition-all cursor-pointer">
                  <div>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                      <Icon size={18} />
                    </div>
                    <p className="font-bold text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </PageContainer>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
