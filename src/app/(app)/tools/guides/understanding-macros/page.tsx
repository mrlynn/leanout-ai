import { PageContainer } from "@/components/PageContainer";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

const MACROS = [
  {
    name: "Protein",
    emoji: "🥩",
    calories: "4 cal / gram",
    color: "bg-red-50 border-red-100",
    headingColor: "text-red-600",
    role: "Protein is the body's primary building block. It repairs muscle tissue, supports immune function, regulates hormones and enzymes, and keeps you full longer than carbs or fat.",
    sources: ["Chicken, turkey, beef", "Eggs & egg whites", "Fish & seafood", "Greek yogurt, cottage cheese", "Whey, casein protein", "Legumes, tofu, tempeh"],
    targets: [
      ["Sedentary adult", "0.36g / lb bodyweight (minimum)"],
      ["Active or dieting", "0.7–1.0g / lb bodyweight"],
      ["Building muscle", "1.0–1.3g / lb bodyweight"],
    ],
    insight: "Protein has the highest thermic effect of food (TEF) — your body burns ~20–30% of protein calories just digesting it. This is why high-protein diets tend to support fat loss even without strict calorie counting.",
  },
  {
    name: "Carbohydrates",
    emoji: "🌾",
    calories: "4 cal / gram",
    color: "bg-amber-50 border-amber-100",
    headingColor: "text-amber-600",
    role: "Carbs are the body's preferred fuel source, especially for the brain and during high-intensity exercise. They're stored as glycogen in your muscles and liver, ready for quick energy.",
    sources: ["Oats, rice, quinoa", "Sweet potatoes, potatoes", "Whole grain bread & pasta", "Fruits", "Vegetables", "Beans & legumes"],
    targets: [
      ["Low-carb / keto", "< 50g / day"],
      ["Fat loss", "100–200g / day"],
      ["Maintenance", "200–300g / day"],
      ["Performance / bulk", "300–500g+ / day"],
    ],
    insight: "Not all carbs are equal. Fiber-rich, slow-digesting carbs (oats, sweet potato, legumes) stabilize blood sugar and keep you full. Refined carbs (white bread, candy, soda) spike blood sugar and can drive fat storage when over-consumed.",
  },
  {
    name: "Fat",
    emoji: "🥑",
    calories: "9 cal / gram",
    color: "bg-blue-50 border-blue-100",
    headingColor: "text-blue-600",
    role: "Fat is essential — not optional. It's required for hormone production (including testosterone and estrogen), fat-soluble vitamin absorption (A, D, E, K), brain health, and cell membrane structure.",
    sources: ["Olive oil, avocado oil", "Avocados", "Nuts & nut butters", "Fatty fish (salmon, sardines)", "Eggs (yolk)", "Cheese, full-fat dairy"],
    targets: [
      ["Minimum", "~0.3g / lb bodyweight"],
      ["Typical range", "25–35% of total calories"],
      ["Keto", "60–75% of total calories"],
    ],
    insight: "Dietary fat doesn't automatically become body fat. Fat storage is driven by a calorie surplus, not by eating fat. Unsaturated fats (from fish, avocado, olive oil) actively support heart and brain health. Limit saturated fat and avoid trans fats.",
  },
];

export default function UnderstandingMacrosPage() {
  return (
    <PageContainer size="content" className="py-8">
      <Link href="/tools" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Tools
      </Link>

      <div className="mb-8">
        <div className="text-4xl mb-3">📊</div>
        <h1 className="text-2xl font-bold">Understanding Macros</h1>
        <p className="text-muted-foreground text-sm mt-1">
          What protein, carbs, and fat actually do — and how much you need of each.
        </p>
      </div>

      {/* Calories primer */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm mb-6">
        <h2 className="font-bold mb-2">The big picture: calories</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          All macronutrients provide energy measured in calories. Protein and carbs each provide <strong>4 calories per gram</strong>. Fat provides <strong>9 calories per gram</strong>. Alcohol provides 7 cal/g (but offers no nutritional value). Your total calorie intake relative to your expenditure determines whether you gain, lose, or maintain weight — macros determine body composition and performance.
        </p>
      </div>

      <div className="space-y-6">
        {MACROS.map(({ name, emoji, calories, color, headingColor, role, sources, targets, insight }) => (
          <div key={name} className={`bg-card border rounded-2xl p-5 shadow-sm ${color}`}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{emoji}</span>
              <div>
                <h2 className={`text-lg font-bold ${headingColor}`}>{name}</h2>
                <span className="text-xs text-muted-foreground">{calories}</span>
              </div>
            </div>

            <p className="text-sm text-foreground/80 leading-relaxed mb-4">{role}</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Good sources</p>
                <ul className="space-y-1">
                  {sources.map((s) => (
                    <li key={s} className="text-xs text-foreground/70 flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${headingColor} bg-current shrink-0`} />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Daily targets</p>
                <div className="space-y-1.5">
                  {targets.map(([label, amount]) => (
                    <div key={label} className="text-xs">
                      <span className="text-muted-foreground">{label}: </span>
                      <span className={`font-semibold ${headingColor}`}>{amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white/60 rounded-xl px-4 py-3 text-xs text-foreground/70 leading-relaxed border border-white/40">
              💡 {insight}
            </div>
          </div>
        ))}
      </div>

      {/* Putting it together */}
      <div className="mt-6 bg-card border border-border rounded-2xl p-5 shadow-sm">
        <h2 className="font-bold text-base mb-3">Putting it all together</h2>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>A practical starting point for most goals:</p>
          <div className="grid grid-cols-3 gap-3 my-3">
            {[
              { goal: "Fat Loss", ratios: "35P / 35C / 30F" },
              { goal: "Maintenance", ratios: "30P / 40C / 30F" },
              { goal: "Muscle Gain", ratios: "30P / 45C / 25F" },
            ].map(({ goal, ratios }) => (
              <div key={goal} className="bg-muted/40 rounded-xl p-3 text-center border border-border">
                <p className="font-semibold text-foreground text-xs mb-1">{goal}</p>
                <p className="text-xs text-primary font-bold">{ratios}</p>
              </div>
            ))}
          </div>
          <p>These are starting points. Track your results for 2–3 weeks and adjust based on how your weight, energy, and performance respond. Use the <Link href="/tools/macro-calculator" className="text-primary hover:underline font-medium">Macro Calculator</Link> to get your personalized gram targets.</p>
        </div>
      </div>
    </PageContainer>
  );
}
