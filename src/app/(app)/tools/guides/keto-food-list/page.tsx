import Link from "next/link";
import { ChevronLeft } from "lucide-react";

const EAT = [
  {
    category: "Meat & Poultry",
    emoji: "🥩",
    color: "bg-red-50 border-red-100",
    headingColor: "text-red-700",
    items: [
      ["Beef (all cuts)", "0g carbs"],
      ["Chicken & turkey", "0g carbs"],
      ["Pork (chops, belly, shoulder)", "0g carbs"],
      ["Lamb & veal", "0g carbs"],
      ["Bacon (uncured, no sugar)", "0–1g carbs"],
      ["Ground beef (80/20)", "0g carbs"],
    ],
  },
  {
    category: "Fish & Seafood",
    emoji: "🐟",
    color: "bg-blue-50 border-blue-100",
    headingColor: "text-blue-700",
    items: [
      ["Salmon", "0g carbs"],
      ["Sardines", "0g carbs"],
      ["Tuna (in water/oil)", "0g carbs"],
      ["Shrimp & prawns", "1g carbs"],
      ["Mackerel", "0g carbs"],
      ["Cod, halibut, tilapia", "0g carbs"],
    ],
  },
  {
    category: "Eggs & Dairy",
    emoji: "🥚",
    color: "bg-yellow-50 border-yellow-100",
    headingColor: "text-yellow-700",
    items: [
      ["Eggs (whole)", "0.6g carbs each"],
      ["Butter & ghee", "0g carbs"],
      ["Heavy cream", "0.4g / tbsp"],
      ["Cream cheese", "1g / oz"],
      ["Cheddar, gouda, brie", "0–1g / oz"],
      ["Full-fat Greek yogurt", "~7g / 6oz — use sparingly"],
    ],
  },
  {
    category: "Fats & Oils",
    emoji: "🫒",
    color: "bg-green-50 border-green-100",
    headingColor: "text-green-700",
    items: [
      ["Olive oil (extra virgin)", "0g carbs"],
      ["Coconut oil", "0g carbs"],
      ["Avocado oil", "0g carbs"],
      ["MCT oil", "0g carbs"],
      ["Lard & tallow", "0g carbs"],
      ["Avocado", "~2g net carbs each"],
    ],
  },
  {
    category: "Low-Carb Vegetables",
    emoji: "🥦",
    color: "bg-emerald-50 border-emerald-100",
    headingColor: "text-emerald-700",
    items: [
      ["Spinach", "0.4g net / cup"],
      ["Kale", "0.5g net / cup"],
      ["Broccoli", "4g net / cup"],
      ["Cauliflower", "3g net / cup"],
      ["Zucchini", "3g net / cup"],
      ["Mushrooms", "1.5g net / cup"],
      ["Asparagus", "2g net / 5 spears"],
      ["Bell pepper (green)", "4g net / cup"],
      ["Cucumber", "2g net / cup"],
      ["Cabbage", "3g net / cup"],
    ],
  },
  {
    category: "Nuts & Seeds",
    emoji: "🥜",
    color: "bg-amber-50 border-amber-100",
    headingColor: "text-amber-700",
    items: [
      ["Macadamia nuts", "1.5g net / oz"],
      ["Pecans", "1g net / oz"],
      ["Walnuts", "2g net / oz"],
      ["Almonds", "2.5g net / oz"],
      ["Chia seeds", "1g net / oz"],
      ["Flaxseeds", "0.4g net / tbsp"],
    ],
  },
  {
    category: "Beverages",
    emoji: "☕",
    color: "bg-slate-50 border-slate-100",
    headingColor: "text-slate-700",
    items: [
      ["Water, sparkling water", "0g carbs"],
      ["Black coffee", "0g carbs"],
      ["Plain tea", "0g carbs"],
      ["Bone broth", "0–1g carbs"],
      ["Unsweetened almond milk", "1g / cup"],
      ["Dry wine (in moderation)", "~4g / 5oz"],
    ],
  },
];

const AVOID = [
  {
    category: "Grains & Starches",
    emoji: "🍞",
    items: ["Bread, pasta, rice, oats", "Corn & popcorn", "Crackers & cereals", "Flour (wheat, corn, oat)", "Potatoes & sweet potatoes", "Quinoa, barley, lentils"],
  },
  {
    category: "Sugars & Sweets",
    emoji: "🍬",
    items: ["Table sugar, honey, maple syrup", "Candy, chocolate (>70% is OK in small amounts)", "Ice cream & frozen yogurt", "Cake, cookies, pastries", "Fruit juice & soda", "Most condiments (ketchup, BBQ sauce, sweet chili)"],
  },
  {
    category: "Most Fruits",
    emoji: "🍌",
    items: ["Bananas (27g carbs each)", "Grapes (26g / cup)", "Apples (25g each)", "Oranges (15g each)", "Mangoes, pineapple, papaya", "Dried fruit (very high sugar)"],
  },
  {
    category: "High-Carb Vegetables",
    emoji: "🥕",
    items: ["Potatoes & sweet potatoes", "Corn (28g / cup)", "Peas (21g / cup)", "Parsnips, beets", "Acorn squash, butternut squash"],
  },
  {
    category: "Legumes",
    emoji: "🫘",
    items: ["Beans (black, kidney, pinto)", "Chickpeas & hummus", "Lentils", "Edamame"],
  },
  {
    category: "Low-Fat & Processed 'Diet' Foods",
    emoji: "⚠️",
    items: ["Low-fat yogurt (loaded with sugar)", "Diet sodas (fine, but may stall some people)", "\"Keto\" bars with maltitol", "Margarine & vegetable oils (canola, soybean)", "Most processed snack foods"],
  },
];

const BORDERLINE = [
  { food: "Berries (strawberries, blueberries)", carbs: "5–15g net / cup", note: "Small portions OK" },
  { food: "Dark chocolate (85%+)", carbs: "10g net / oz", note: "1–2 squares fine" },
  { food: "Full-fat Greek yogurt", carbs: "7g net / 6oz", note: "Fits if you budget it" },
  { food: "Onions", carbs: "7g net / ½ cup", note: "Use as flavoring, not base" },
  { food: "Tomatoes", carbs: "4g net / medium", note: "Count carefully" },
  { food: "Carrots (raw)", carbs: "8g net / medium", note: "Small portions only" },
];

export default function KetoFoodListPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Link href="/tools" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Tools
      </Link>

      <div className="mb-8">
        <div className="text-4xl mb-3">🥩</div>
        <h1 className="text-2xl font-bold">Keto Food List</h1>
        <p className="text-muted-foreground text-sm mt-1">
          What to eat, what to avoid, and the foods that live in between.
        </p>
      </div>

      <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 mb-6 text-sm text-primary">
        <strong>The rule:</strong> Keep net carbs under 20–30g per day. Net carbs = Total carbs − Fiber. Focus on whole, unprocessed foods. If it grows underground or comes in a box, double-check the label.
      </div>

      {/* Eat freely */}
      <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">✅ Eat freely</h2>
      <div className="space-y-4 mb-8">
        {EAT.map(({ category, emoji, color, headingColor, items }) => (
          <div key={category} className={`rounded-2xl border p-5 ${color}`}>
            <h3 className={`font-bold text-sm mb-3 ${headingColor}`}>{emoji} {category}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
              {items.map(([food, carbs]) => (
                <div key={food} className="flex justify-between items-center text-xs py-1 border-b border-white/40 last:border-0">
                  <span className="font-medium text-foreground/80">{food}</span>
                  <span className={`${headingColor} font-semibold opacity-70`}>{carbs}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Borderline */}
      <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">⚖️ Eat in moderation</h2>
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm mb-8">
        <div className="space-y-2">
          {BORDERLINE.map(({ food, carbs, note }) => (
            <div key={food} className="flex items-start justify-between gap-4 py-2 border-b border-border last:border-0">
              <div className="min-w-0">
                <p className="text-sm font-medium">{food}</p>
                <p className="text-xs text-muted-foreground">{note}</p>
              </div>
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg shrink-0">{carbs}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Avoid */}
      <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">❌ Avoid</h2>
      <div className="space-y-3 mb-6">
        {AVOID.map(({ category, emoji, items }) => (
          <div key={category} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-sm text-red-700 mb-2">{emoji} {category}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
              {items.map((item) => (
                <p key={item} className="text-xs text-muted-foreground flex gap-1.5">
                  <span className="text-red-400 shrink-0">×</span> {item}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-3">
        <Link href="/tools/guides/keto-101" className="flex-1 bg-card border border-border rounded-xl p-4 text-center text-sm font-semibold hover:border-primary/40 transition-colors">
          🥑 Keto 101 →
        </Link>
        <Link href="/tools/guides/keto-macros" className="flex-1 bg-card border border-border rounded-xl p-4 text-center text-sm font-semibold hover:border-primary/40 transition-colors">
          📊 Keto Macros Guide →
        </Link>
      </div>
    </div>
  );
}
