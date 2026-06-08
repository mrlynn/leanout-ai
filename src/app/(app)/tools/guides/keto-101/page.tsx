import Link from "next/link";
import { ChevronLeft } from "lucide-react";

const PHASES = [
  {
    day: "Days 1–3",
    title: "Glycogen depletion",
    body: "Your body burns through stored glucose (glycogen) in the liver and muscles. You may feel normal or slightly tired. Weight drops quickly — mostly water.",
    color: "bg-blue-50 border-blue-100 text-blue-700",
  },
  {
    day: "Days 3–7",
    title: "Keto flu (optional)",
    body: "Some people experience fatigue, headaches, brain fog, or irritability as the brain switches fuels. This is temporary and largely preventable with electrolytes.",
    color: "bg-amber-50 border-amber-100 text-amber-700",
  },
  {
    day: "Week 2–4",
    title: "Fat adaptation begins",
    body: "Ketone production ramps up. Energy stabilizes. Mental clarity often improves. Hunger decreases — fat and protein are highly satiating.",
    color: "bg-orange-50 border-orange-100 text-orange-700",
  },
  {
    day: "Month 2+",
    title: "Full fat adaptation",
    body: "Your body efficiently runs on fat and ketones. Athletic performance normalizes. Many people report sustained energy without the crashes of carb-based eating.",
    color: "bg-green-50 border-green-100 text-green-700",
  },
];

const BENEFITS = [
  { emoji: "🔥", title: "Fat loss", body: "Suppressed appetite + lower insulin = easier calorie deficit without hunger." },
  { emoji: "🧠", title: "Mental clarity", body: "Ketones are a more efficient brain fuel than glucose for many people." },
  { emoji: "📉", title: "Blood sugar control", body: "Dramatic reduction in blood glucose and insulin spikes — particularly useful for type 2 diabetes management." },
  { emoji: "⚡", title: "Stable energy", body: "No more post-meal energy crashes. Fat is a slow-burning, steady fuel source." },
  { emoji: "💪", title: "Muscle preservation", body: "High protein intake on keto protects lean mass during a calorie deficit better than low-fat diets." },
];

const MISTAKES = [
  { mistake: "Not eating enough fat", fix: "Fat is your primary fuel — don't fear it. If you cut carbs AND keep fat low, you'll just be starving." },
  { mistake: "Ignoring electrolytes", fix: "Low-carb causes kidneys to excrete more sodium, potassium, and magnesium. Supplement or you'll feel terrible." },
  { mistake: "Hidden carbs", fix: "Sauces, dressings, flavored drinks, and \"keto\" packaged foods often have more carbs than labeled. Read everything." },
  { mistake: "Giving up during keto flu", fix: "Days 3–5 are the hardest. Push through with electrolytes and adequate fat intake — it passes." },
  { mistake: "Eating too much protein", fix: "Excess protein can convert to glucose (gluconeogenesis), slowing or preventing ketosis. Keep protein moderate." },
  { mistake: "Not tracking at the start", fix: "Carbs hide everywhere. Track for the first 2–4 weeks until you have an intuitive sense of what fits." },
];

export default function Keto101Page() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Link href="/tools" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Tools
      </Link>

      <div className="mb-8">
        <div className="text-4xl mb-3">🥑</div>
        <h1 className="text-2xl font-bold">Keto 101</h1>
        <p className="text-muted-foreground text-sm mt-1">
          How the ketogenic diet works, what to expect, and the most common mistakes.
        </p>
      </div>

      {/* What is keto */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm mb-5">
        <h2 className="font-bold text-base mb-3">What is ketosis?</h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          Your body normally runs on glucose (sugar) from carbohydrates. When you restrict carbs to roughly <strong>20–50g per day</strong>, glucose runs out and the liver begins converting fat into <strong>ketone bodies</strong> — an alternative fuel used by the brain, muscles, and organs.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This metabolic state is called <strong>ketosis</strong>. It&apos;s a natural survival mechanism — humans evolved to function well on fat during periods without carbohydrates. The ketogenic diet deliberately induces and sustains this state.
        </p>
      </div>

      {/* Macro split */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm mb-5">
        <h2 className="font-bold text-base mb-3">The keto macro split</h2>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { macro: "Fat", pct: "70–75%", color: "bg-blue-50 border-blue-100 text-blue-700", bar: "bg-blue-400" },
            { macro: "Protein", pct: "20–25%", color: "bg-red-50 border-red-100 text-red-700", bar: "bg-red-400" },
            { macro: "Carbs", pct: "5%", color: "bg-amber-50 border-amber-100 text-amber-700", bar: "bg-amber-400" },
          ].map(({ macro, pct, color }) => (
            <div key={macro} className={`rounded-xl border p-4 text-center ${color}`}>
              <p className="text-2xl font-black">{pct}</p>
              <p className="text-xs font-semibold mt-0.5 uppercase tracking-wide opacity-70">{macro}</p>
            </div>
          ))}
        </div>
        <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
          <div className="bg-blue-400 rounded-l-full" style={{ width: "72%" }} />
          <div className="bg-red-400" style={{ width: "23%" }} />
          <div className="bg-amber-400 rounded-r-full" style={{ width: "5%" }} />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
          <span>Fat 72%</span>
          <span>Protein 23%</span>
          <span>Carbs 5%</span>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          In practice, aim for <strong>20–50g net carbs per day</strong>. Net carbs = total carbs − fiber. Most people achieve ketosis reliably under 30g.
        </p>
      </div>

      {/* What to expect */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm mb-5">
        <h2 className="font-bold text-base mb-3">What to expect week by week</h2>
        <div className="space-y-3">
          {PHASES.map(({ day, title, body, color }) => (
            <div key={day} className={`rounded-xl border p-4 ${color}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wide opacity-60">{day}</span>
              </div>
              <p className="font-semibold text-sm">{title}</p>
              <p className="text-sm opacity-80 mt-1 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm mb-5">
        <h2 className="font-bold text-base mb-3">Potential benefits</h2>
        <div className="space-y-3">
          {BENEFITS.map(({ emoji, title, body }) => (
            <div key={title} className="flex gap-3">
              <span className="text-2xl shrink-0">{emoji}</span>
              <div>
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Common mistakes */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm mb-5">
        <h2 className="font-bold text-base mb-3">6 common keto mistakes</h2>
        <div className="space-y-3">
          {MISTAKES.map(({ mistake, fix }) => (
            <div key={mistake} className="border border-border rounded-xl p-4">
              <p className="text-sm font-semibold text-red-600 mb-1">✗ {mistake}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">→ {fix}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Electrolytes */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 shadow-sm mb-5">
        <h2 className="font-bold text-base mb-3 text-amber-800">⚡ Electrolytes — the most important keto supplement</h2>
        <p className="text-sm text-amber-700 leading-relaxed mb-3">
          When insulin drops on keto, kidneys flush sodium — and sodium loss pulls potassium and magnesium with it. This is the #1 cause of keto flu. Supplement daily:
        </p>
        <div className="space-y-2">
          {[
            ["Sodium", "2,000–4,000mg / day", "Salt your food liberally. Broth is great."],
            ["Potassium", "1,000–3,500mg / day", "Avocado, leafy greens, salt substitute (KCl)."],
            ["Magnesium", "300–500mg / day", "Magnesium glycinate before bed. Helps sleep too."],
          ].map(([mineral, dose, source]) => (
            <div key={mineral} className="bg-white/70 rounded-xl px-4 py-3 text-sm">
              <div className="flex justify-between items-center mb-0.5">
                <span className="font-semibold text-amber-900">{mineral}</span>
                <span className="text-amber-700 font-medium text-xs">{dose}</span>
              </div>
              <p className="text-amber-600 text-xs">{source}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Who should avoid */}
      <div className="bg-red-50 border border-red-100 rounded-2xl p-5 shadow-sm">
        <h2 className="font-bold text-base mb-2 text-red-800">⚠️ Who should consult a doctor first</h2>
        <ul className="text-sm text-red-700 space-y-1.5">
          {[
            "Type 1 diabetics (risk of diabetic ketoacidosis)",
            "People on insulin or blood sugar medications",
            "Those with kidney disease or a history of kidney stones",
            "Pregnant or breastfeeding women",
            "People with a history of eating disorders",
          ].map((item) => (
            <li key={item} className="flex gap-2">
              <span className="shrink-0">•</span> {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 flex gap-3">
        <Link href="/tools/guides/keto-food-list" className="flex-1 bg-card border border-border rounded-xl p-4 text-center text-sm font-semibold hover:border-primary/40 transition-colors">
          🥩 Keto Food List →
        </Link>
        <Link href="/tools/guides/keto-macros" className="flex-1 bg-card border border-border rounded-xl p-4 text-center text-sm font-semibold hover:border-primary/40 transition-colors">
          📊 Keto Macros Calculator Guide →
        </Link>
      </div>
    </div>
  );
}
