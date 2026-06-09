"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calculator,
  Beef,
  Scale,
  Activity,
  Target,
  Dumbbell,
  Droplets,
  BookOpen,
  ChevronRight,
  ArrowLeftRight,
  Camera,
  TrendingUp,
  Coffee,
  Clock,
  BarChart2,
} from "lucide-react";

interface DBGuide {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  emoji: string;
}

const CALCULATORS = [
  {
    href: "/tools/calorie-calculator",
    icon: Calculator,
    title: "Calorie Calculator",
    description: "Estimate daily calories to maintain your current weight across all activity levels.",
    iconBg: "bg-orange-50 border-orange-100 text-orange-500",
  },
  {
    href: "/tools/macro-calculator",
    icon: Beef,
    title: "Macro Calculator",
    description: "Find your ideal daily protein, carb, and fat targets tailored to your goal.",
    iconBg: "bg-red-50 border-red-100 text-red-500",
  },
  {
    href: "/tools/bmi",
    icon: Scale,
    title: "BMI Calculator",
    description: "Body Mass Index — a quick height-and-weight screening with a visual gauge.",
    iconBg: "bg-purple-50 border-purple-100 text-purple-500",
  },
  {
    href: "/tools/body-fat",
    icon: Activity,
    title: "Body Fat % Estimator",
    description: "U.S. Navy tape-measure method — no calipers needed. Get your estimated BF% category.",
    iconBg: "bg-blue-50 border-blue-100 text-blue-500",
  },
  {
    href: "/tools/ideal-weight",
    icon: Target,
    title: "Ideal Weight Calculator",
    description: "Four clinical formulas (Devine, Robinson, Miller, Hamwi) with a recommended range.",
    iconBg: "bg-green-50 border-green-100 text-green-500",
  },
  {
    href: "/tools/protein",
    icon: Beef,
    title: "Protein Calculator",
    description: "Daily protein targets by goal and activity level, with a meal-by-meal breakdown.",
    iconBg: "bg-rose-50 border-rose-100 text-rose-500",
  },
  {
    href: "/tools/one-rep-max",
    icon: Dumbbell,
    title: "One-Rep Max (1RM)",
    description: "Estimate your max lift and get a full training-zone weight chart.",
    iconBg: "bg-amber-50 border-amber-100 text-amber-500",
  },
  {
    href: "/tools/water",
    icon: Droplets,
    title: "Water Intake Calculator",
    description: "Daily hydration target in oz, mL, and cups — plus an hourly sip schedule.",
    iconBg: "bg-sky-50 border-sky-100 text-sky-500",
  },
  {
    href: "/tools/plate-converter",
    icon: ArrowLeftRight,
    title: "Plate Converter",
    description: "Convert kg ↔ lbs for plates and bars. Includes a barbell load calculator with a visual plate diagram.",
    iconBg: "bg-slate-50 border-slate-200 text-slate-500",
  },
  {
    href: "/tools/meal-photo",
    icon: Camera,
    title: "Meal Photo Analyzer",
    description: "Snap or upload a photo of any meal — AI estimates calories, protein, carbs, and fat instantly.",
    iconBg: "bg-violet-50 border-violet-100 text-violet-500",
  },
  {
    href: "/tools/adaptive-tdee",
    icon: TrendingUp,
    title: "Adaptive TDEE Calculator",
    description: "Uses your actual weight trend to back-calculate your true maintenance calories — beats any formula.",
    iconBg: "bg-emerald-50 border-emerald-100 text-emerald-500",
  },
  {
    href: "/tools/reverse-diet",
    icon: TrendingUp,
    title: "Reverse Dieting Planner",
    description: "Week-by-week calorie ramp-up schedule after a cut — add food back without gaining fat.",
    iconBg: "bg-teal-50 border-teal-100 text-teal-500",
  },
  {
    href: "/tools/diet-break",
    icon: Coffee,
    title: "Diet Break Planner",
    description: "Know when to take a strategic maintenance break to restore hormones and keep fat loss moving.",
    iconBg: "bg-amber-50 border-amber-100 text-amber-500",
  },
  {
    href: "/tools/fasting",
    icon: Clock,
    title: "Intermittent Fasting Planner",
    description: "Pick a protocol (16:8, 18:6, OMAD, 5:2) and get your daily eating window with macro tips.",
    iconBg: "bg-indigo-50 border-indigo-100 text-indigo-500",
  },
  {
    href: "/tools/visceral-fat",
    icon: Activity,
    title: "Visceral Fat Risk Estimator",
    description: "Waist-to-height ratio — a stronger predictor of metabolic disease risk than BMI.",
    iconBg: "bg-pink-50 border-pink-100 text-pink-500",
  },
  {
    href: "/tools/periodization",
    icon: BarChart2,
    title: "Cut / Bulk / Maintain Planner",
    description: "Get a phased plan: when to cut, when to bulk, and what to eat in each phase based on your body fat.",
    iconBg: "bg-cyan-50 border-cyan-100 text-cyan-500",
  },
];

const GUIDES = [
  {
    href: "/tools/guides/reading-labels",
    title: "How to Read a Nutrition Label",
    description: "Decode serving sizes, % DV, and hidden sugars in under 2 minutes.",
    emoji: "🏷️",
  },
  {
    href: "/tools/guides/high-protein-swaps",
    title: "High-Protein Food Swaps",
    description: "Simple substitutions to hit your protein goal without overhauling your diet.",
    emoji: "💪",
  },
  {
    href: "/tools/guides/understanding-macros",
    title: "Understanding Macros",
    description: "What protein, carbs, and fat actually do — and how much you need of each.",
    emoji: "📊",
  },
  {
    href: "/tools/guides/keto-101",
    title: "Keto 101",
    description: "How ketosis works, what to expect week by week, electrolytes, and the most common mistakes.",
    emoji: "🥑",
  },
  {
    href: "/tools/guides/keto-food-list",
    title: "Keto Food List",
    description: "Complete eat / avoid / moderation lists with net carb counts for every category.",
    emoji: "🥩",
  },
  {
    href: "/tools/guides/keto-macros",
    title: "Keto Macros Guide",
    description: "Step-by-step: calculate your personal fat, protein, and carb targets for keto.",
    emoji: "📊",
  },
  {
    href: "/tools/guides/supplements",
    title: "Supplement Evidence Guide",
    description: "Evidence ratings (A–D) for 15 popular supplements — dose, timing, side effects, and who it's for.",
    emoji: "💊",
  },
  {
    href: "/tools/guides/cycle-nutrition",
    title: "Menstrual Cycle Nutrition Guide",
    description: "How to adjust macros, calories, and training across all 4 cycle phases for better results.",
    emoji: "🌸",
  },
];

export default function ToolsPage() {
  const [dbGuides, setDbGuides] = useState<DBGuide[]>([]);

  useEffect(() => {
    fetch("/api/guides")
      .then((r) => r.ok ? r.json() : [])
      .then(setDbGuides)
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Tools & Resources</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Calculators and guides to support every part of your fitness journey.
        </p>
      </div>

      {/* Calculators */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Calculators</h2>
        <div className="space-y-2">
          {CALCULATORS.map(({ href, icon: Icon, title, description, iconBg }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4 shadow-sm hover:border-primary/40 hover:shadow-md transition-all group"
            >
              <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{description}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      </section>

      {/* Guides */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Guides</h2>
        <div className="space-y-2">
          {GUIDES.map(({ href, title, description, emoji }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4 shadow-sm hover:border-primary/40 hover:shadow-md transition-all group"
            >
              <div className="w-11 h-11 rounded-xl border border-border bg-muted/40 flex items-center justify-center shrink-0 text-xl">
                {emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{description}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> Guide
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Link>
          ))}
          {dbGuides.map((g) => (
            <Link
              key={g._id}
              href={`/tools/guides/${g.slug}`}
              className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4 shadow-sm hover:border-primary/40 hover:shadow-md transition-all group"
            >
              <div className="w-11 h-11 rounded-xl border border-border bg-muted/40 flex items-center justify-center shrink-0 text-xl">
                {g.emoji || "📖"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">{g.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{g.summary}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> Guide
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
