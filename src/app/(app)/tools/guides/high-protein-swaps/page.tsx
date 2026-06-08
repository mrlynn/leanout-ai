import Link from "next/link";
import { ChevronLeft } from "lucide-react";

const SWAPS = [
  {
    category: "Breakfast",
    items: [
      { from: "Sugary cereal (3g protein)", to: "Greek yogurt parfait (17g protein)", emoji: "🥛" },
      { from: "Pancakes with syrup (5g protein)", to: "Protein pancakes with eggs (22g protein)", emoji: "🥞" },
      { from: "Bagel with cream cheese (8g protein)", to: "Bagel with smoked salmon + cream cheese (18g protein)", emoji: "🐟" },
      { from: "Oatmeal plain (5g protein)", to: "Oatmeal + 1 scoop whey + PB (28g protein)", emoji: "🥜" },
    ],
  },
  {
    category: "Lunch",
    items: [
      { from: "Caesar salad, no protein (4g protein)", to: "Caesar salad + grilled chicken (34g protein)", emoji: "🍗" },
      { from: "Grilled cheese sandwich (12g protein)", to: "Turkey & cheese on whole grain (28g protein)", emoji: "🥪" },
      { from: "Veggie wrap (6g protein)", to: "Chicken or shrimp wrap (30g protein)", emoji: "🌯" },
      { from: "Cup of noodle soup (4g protein)", to: "Lentil soup or chicken soup (18g protein)", emoji: "🍲" },
    ],
  },
  {
    category: "Snacks",
    items: [
      { from: "Chips (2g protein)", to: "Edamame (17g protein)", emoji: "🫛" },
      { from: "Fruit juice (0g protein)", to: "Cottage cheese + fruit (13g protein)", emoji: "🧀" },
      { from: "Granola bar (3g protein)", to: "Jerky stick (10g protein)", emoji: "🥩" },
      { from: "Rice cakes (1g protein)", to: "Rice cakes + tuna pouch (20g protein)", emoji: "🐟" },
    ],
  },
  {
    category: "Dinner",
    items: [
      { from: "Pasta primavera (8g protein)", to: "Pasta with ground turkey + tomato sauce (32g protein)", emoji: "🍝" },
      { from: "Cheese pizza (12g protein)", to: "Chicken + veggie pizza, light cheese (28g protein)", emoji: "🍕" },
      { from: "Fried rice (6g protein)", to: "Fried rice + shrimp or egg (22g protein)", emoji: "🍳" },
      { from: "Bean tacos (10g protein)", to: "Chicken or steak tacos (30g protein)", emoji: "🌮" },
    ],
  },
];

export default function HighProteinSwapsPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Link href="/tools" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Tools
      </Link>

      <div className="mb-8">
        <div className="text-4xl mb-3">💪</div>
        <h1 className="text-2xl font-bold">High-Protein Food Swaps</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Simple substitutions to hit your protein goal without overhauling your diet.
        </p>
      </div>

      <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 mb-6 text-sm text-primary">
        <strong>The rule of thumb:</strong> Aim for at least 10g of protein per 100 calories in the foods you eat most. Use these swaps to upgrade your existing meals — no special ingredients required.
      </div>

      <div className="space-y-6">
        {SWAPS.map(({ category, items }) => (
          <div key={category}>
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">{category}</h2>
            <div className="space-y-2">
              {items.map(({ from, to, emoji }) => (
                <div key={from} className="bg-card border border-border rounded-2xl p-4 shadow-sm flex items-start gap-4">
                  <div className="text-2xl shrink-0">{emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-muted-foreground line-through">{from}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-green-500 text-xs font-bold">→</span>
                      <span className="text-sm font-semibold text-foreground">{to}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Power foods */}
      <div className="mt-8 bg-card border border-border rounded-2xl p-5 shadow-sm">
        <h2 className="font-bold text-base mb-3">🏆 The highest protein foods per calorie</h2>
        <div className="space-y-2">
          {[
            ["Egg whites", "~26g / 100 cal"],
            ["Canned tuna (in water)", "~22g / 100 cal"],
            ["Chicken breast (grilled)", "~20g / 100 cal"],
            ["Non-fat Greek yogurt", "~18g / 100 cal"],
            ["Shrimp (cooked)", "~20g / 100 cal"],
            ["Whey protein isolate", "~22g / 100 cal"],
            ["Low-fat cottage cheese", "~12g / 100 cal"],
            ["Tempeh", "~10g / 100 cal"],
          ].map(([food, ratio]) => (
            <div key={food} className="flex justify-between items-center text-sm py-1.5 border-b border-border last:border-0">
              <span className="font-medium">{food}</span>
              <span className="text-primary font-semibold">{ratio}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
