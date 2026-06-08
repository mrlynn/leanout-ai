import Link from "next/link";
import { ChevronLeft } from "lucide-react";

const SECTIONS = [
  {
    heading: "1. Start with serving size",
    body: "Everything on the label is based on one serving — not the whole package. A bag of chips might list 150 calories per serving, but contain 3 servings. Always multiply by the number of servings you actually eat.",
    tip: "Check the serving size first. It's the most commonly ignored number on the label.",
  },
  {
    heading: "2. Calories",
    body: "Calories tell you how much energy is in one serving. For most people, 2,000 calories per day is used as a reference — but your actual target depends on your size, activity, and goals. Use the Calorie Calculator to find yours.",
    tip: null,
  },
  {
    heading: "3. Macronutrients: Fat, Carbs, Protein",
    body: "These three macros make up the calorie total. Fat = 9 cal/g. Carbs = 4 cal/g. Protein = 4 cal/g. Pay attention to saturated fat (raise LDL cholesterol) and added sugars (hidden in many packaged foods). Dietary fiber is part of total carbs but doesn't raise blood sugar — subtract it if you track net carbs.",
    tip: "Look for foods where protein is high relative to calories. 10g of protein per 100 calories is a solid ratio.",
  },
  {
    heading: "4. % Daily Value (%DV)",
    body: "The %DV shows how much of a nutrient one serving contributes to a 2,000-calorie diet. 5% or less is low; 20% or more is high. Use it quickly: high %DV for sodium or saturated fat = caution; high %DV for fiber, vitamins, and minerals = good.",
    tip: null,
  },
  {
    heading: "5. Ingredients list",
    body: "Ingredients are listed in descending order by weight — so the first few ingredients make up most of the product. If sugar (or one of its many aliases: corn syrup, dextrose, fructose, cane juice) appears in the first three, the product is sugar-heavy regardless of what the front of the package says.",
    tip: "A short ingredients list usually means less processing.",
  },
];

const SUGAR_ALIASES = [
  "High-fructose corn syrup", "Cane juice", "Dextrose", "Maltose",
  "Sucrose", "Fructose", "Barley malt", "Agave nectar",
];

export default function ReadingLabelsPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Link href="/tools" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Tools
      </Link>

      <div className="mb-8">
        <div className="text-4xl mb-3">🏷️</div>
        <h1 className="text-2xl font-bold">How to Read a Nutrition Label</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Decode serving sizes, % DV, and hidden sugars in under 2 minutes.
        </p>
      </div>

      <div className="space-y-5">
        {SECTIONS.map(({ heading, body, tip }) => (
          <div key={heading} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-base mb-2">{heading}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            {tip && (
              <div className="mt-3 bg-primary/5 border border-primary/10 rounded-xl px-4 py-2.5 text-sm text-primary font-medium">
                💡 {tip}
              </div>
            )}
          </div>
        ))}

        {/* Sugar aliases */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-base mb-3">🍬 Sugar&apos;s many disguises</h2>
          <p className="text-sm text-muted-foreground mb-3">
            There are over 60 names for added sugar. Watch for these on ingredients lists:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {SUGAR_ALIASES.map((alias) => (
              <div key={alias} className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-800 font-medium">
                {alias}
              </div>
            ))}
          </div>
        </div>

        {/* Quick reference */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-base mb-3">⚡ Quick reference</h2>
          <div className="space-y-2">
            {[
              ["Calories", "Energy per serving"],
              ["Total Fat", "Keep sat. fat low; unsaturated fat is fine"],
              ["Sodium", "Under 2,300mg/day for most adults"],
              ["Total Carbs", "Includes fiber + sugars"],
              ["Dietary Fiber", "Aim for 25–38g/day"],
              ["Added Sugars", "Minimize — limit to <10% of calories"],
              ["Protein", "Higher is usually better"],
            ].map(([term, def]) => (
              <div key={term} className="flex justify-between items-start text-sm py-1.5 border-b border-border last:border-0">
                <span className="font-semibold w-36 shrink-0">{term}</span>
                <span className="text-muted-foreground text-right">{def}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
