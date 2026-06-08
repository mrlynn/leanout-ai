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
} from "lucide-react";

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
];

export default function ToolsPage() {
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
        </div>
      </section>
    </div>
  );
}
