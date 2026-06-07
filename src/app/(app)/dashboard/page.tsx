import { GamificationCard } from "@/components/GamificationCard";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { calculatePhysique, calculateMacros } from "@/lib/calculator";
import type { ActivityLevel } from "@/lib/calculator";
import { aggregateDayTotals, getDateString } from "@/lib/foodLog";
import FoodLogEntry from "@/models/FoodLogEntry";
import Link from "next/link";
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
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();
  const user = await User.findById(session.user.id).lean();
  if (!user?.onboardingComplete) redirect("/onboarding");

  const physique =
    user.weightLbs && user.bodyFatPercent && user.heightInches && user.age && user.sex && user.activityLevel && user.goalType
      ? calculatePhysique({
          weightLbs: user.weightLbs,
          bodyFatPercent: user.bodyFatPercent,
          heightInches: user.heightInches,
          age: user.age,
          sex: user.sex as "male" | "female",
          activityLevel: user.activityLevel as ActivityLevel,
          goalType: user.goalType as "lose_fat" | "maintain" | "build_muscle",
        })
      : null;

  const macros = physique ? calculateMacros(physique.targetCalories, physique.leanBodyMassLbs) : null;
  const firstName = user.name?.split(" ")[0] ?? "there";

  const today = getDateString();
  const foodEntries = await FoodLogEntry.find({ userId: session.user.id, date: today }).lean();
  const intake = aggregateDayTotals(foodEntries);

  const quickLinks = [
    { href: "/meal-plan", label: "Meal Plan", sub: "7-day AI plan", icon: UtensilsCrossed, color: "bg-orange-50 text-orange-600" },
    { href: "/food-log", label: "Food Log", sub: "Track intake", icon: Camera, color: "bg-rose-50 text-rose-600" },
    { href: "/check-in", label: "Check-in", sub: "Log today", icon: ClipboardCheck, color: "bg-blue-50 text-blue-600" },
    { href: "/progress", label: "Progress", sub: "Charts & trends", icon: TrendingUp, color: "bg-green-50 text-green-600" },
    { href: "/coach", label: "AI Coach", sub: "Chat with Claude", icon: MessageSquare, color: "bg-purple-50 text-purple-600" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="gradient-orange px-6 pt-10 pb-16 md:pt-12">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-orange-200 text-sm font-medium mb-1">Good {getTimeOfDay()},</p>
              <h1 className="text-3xl font-black text-white tracking-tight">{firstName} 👊</h1>
            </div>
            <Link href="/onboarding" className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
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
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 -mt-6 pb-10 space-y-5">
        {/* Macros card */}
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

        {/* Body composition */}
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

        {/* Gamification */}
        <GamificationCard />

        {/* Quick links */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Your tools</p>
          <div className="grid grid-cols-2 gap-3">
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
      </div>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
