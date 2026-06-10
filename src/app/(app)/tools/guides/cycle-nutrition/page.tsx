import { PageContainer } from "@/components/PageContainer";
interface CyclePhase {
  name: string;
  days: string;
  hormone: string;
  emoji: string;
  color: string;
  energy: string;
  calorieAdjust: string;
  carbs: string;
  protein: string;
  fat: string;
  training: string;
  foods: string[];
  tips: string[];
}

const PHASES: CyclePhase[] = [
  {
    name: "Menstrual Phase",
    days: "Days 1–5",
    hormone: "Estrogen & progesterone at their lowest",
    emoji: "🔴",
    color: "bg-red-50 border-red-200",
    energy: "Low — rest and recovery is appropriate",
    calorieAdjust: "Eat at or slightly above maintenance",
    carbs: "Moderate — complex carbs help with fatigue and mood",
    protein: "Normal (0.7–1g/lb)",
    fat: "Higher — omega-3s reduce cramps and inflammation",
    training: "Low-intensity: walking, yoga, light stretching. Respect your energy level.",
    foods: ["Salmon, sardines (omega-3)", "Dark leafy greens (iron)", "Dark chocolate (magnesium)", "Legumes and whole grains"],
    tips: [
      "Iron losses are highest during menstruation — prioritize iron-rich foods",
      "Magnesium (leafy greens, dark chocolate) reduces cramps",
      "Anti-inflammatory foods (omega-3s, ginger, turmeric) help with pain",
      "Avoid excessive caffeine — it can worsen cramps and disrupt iron absorption",
    ],
  },
  {
    name: "Follicular Phase",
    days: "Days 6–13",
    hormone: "Estrogen rising",
    emoji: "🌱",
    color: "bg-green-50 border-green-200",
    energy: "High and increasing — best phase for performance",
    calorieAdjust: "Normal or slight deficit if cutting (metabolism is more favorable)",
    carbs: "Higher — insulin sensitivity peaks here",
    protein: "Normal (0.7–1g/lb)",
    fat: "Moderate",
    training: "Lift heavy, hit PRs, run fast. This is your peak performance window.",
    foods: ["Eggs, chicken, fish (lean protein)", "Fermented foods (gut health / estrogen metabolism)", "Cruciferous vegetables (broccoli, kale)", "Whole grains and legumes"],
    tips: [
      "Estrogen boosts insulin sensitivity — carbs are better utilized in this phase",
      "Great phase for high-intensity interval training and max-effort sessions",
      "Estrogen increases pain tolerance — ideal for breaking personal records",
      "Focus on variety of whole foods to support healthy estrogen metabolism",
    ],
  },
  {
    name: "Ovulation Phase",
    days: "Days 14–16",
    hormone: "LH and estrogen surge",
    emoji: "⚡",
    color: "bg-yellow-50 border-yellow-200",
    energy: "Peak — energy and motivation highest",
    calorieAdjust: "Normal maintenance",
    carbs: "Moderate to high",
    protein: "Slightly higher — muscle synthesis peaks",
    fat: "Moderate",
    training: "Best days for strength training, heavy lifting, and competitive performance.",
    foods: ["Lean proteins (chicken, turkey, fish)", "Zinc-rich foods (pumpkin seeds, beef)", "Antioxidant-rich berries and vegetables", "Fiber to support estrogen clearance"],
    tips: [
      "Testosterone also briefly peaks around ovulation — leverage this for strength gains",
      "Ligament laxity increases slightly — warm up thoroughly to reduce injury risk",
      "Great window for social workouts, classes, and events requiring high output",
      "Stay hydrated — body temperature is slightly elevated",
    ],
  },
  {
    name: "Luteal Phase",
    days: "Days 17–28",
    hormone: "Progesterone dominant",
    emoji: "🌙",
    color: "bg-purple-50 border-purple-200",
    energy: "Declining — cravings and fatigue increase toward end",
    calorieAdjust: "Slightly higher (+100–200 cal) — BMR is naturally higher",
    carbs: "Higher carbs help regulate mood (serotonin support) — especially late luteal",
    protein: "Higher — protein oxidation increases",
    fat: "Normal",
    training: "Moderate intensity. Cardio and moderate weights. Listen to your body as PMS symptoms appear.",
    foods: ["Complex carbs (sweet potato, oats, brown rice)", "Tryptophan foods (turkey, eggs, cheese) for serotonin", "Calcium-rich foods (reduce PMS symptoms)", "Reduce sodium to minimize bloating"],
    tips: [
      "Resting metabolic rate increases 100–300 cal/day — hunger is physiological, not weakness",
      "Progesterone impairs insulin sensitivity — reduce refined sugar to avoid crashes",
      "B6 and magnesium reduce PMS symptoms — found in leafy greens, nuts, bananas",
      "Reduce alcohol — it amplifies PMS symptoms and disrupts sleep quality",
      "Sleep quality often declines — prioritize sleep hygiene in this phase",
    ],
  },
];

export default function CycleNutritionPage() {
  return (
    <PageContainer size="content" className="py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl border border-border bg-muted/40 flex items-center justify-center text-xl">
          🌸
        </div>
        <div>
          <h1 className="text-2xl font-bold">Menstrual Cycle Nutrition Guide</h1>
          <p className="text-sm text-muted-foreground">
            How to adjust your food and training across all 4 phases of your cycle.
          </p>
        </div>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 mb-6 text-sm text-purple-800">
        <p className="font-semibold mb-1">Why cycle-syncing nutrition works</p>
        <p>Estrogen and progesterone directly affect metabolism, insulin sensitivity, protein oxidation, and energy. Eating and training in sync with these hormonal shifts — rather than against them — improves performance, reduces PMS, and makes fat loss more sustainable.</p>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-8">
        {PHASES.map((p) => (
          <div key={p.name} className={`rounded-xl border p-3 text-center ${p.color}`}>
            <div className="text-2xl mb-1">{p.emoji}</div>
            <p className="text-xs font-bold leading-tight">{p.name}</p>
            <p className="text-xs opacity-70 mt-0.5">{p.days}</p>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {PHASES.map((phase) => (
          <div key={phase.name} className={`rounded-2xl border p-6 ${phase.color} space-y-4`}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{phase.emoji}</span>
                <div>
                  <h2 className="font-bold text-foreground">{phase.name}</h2>
                  <p className="text-xs text-muted-foreground">{phase.days} · {phase.hormone}</p>
                </div>
              </div>
              <p className="text-sm font-medium mt-2">{phase.energy}</p>
            </div>

            <div className="bg-white/70 rounded-xl p-4 space-y-2 text-sm">
              <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-2">Nutrition targets</p>
              <div className="grid grid-cols-1 gap-1.5 text-xs">
                <div className="flex gap-2"><span className="text-muted-foreground w-28 shrink-0">Calories:</span><span className="font-medium">{phase.calorieAdjust}</span></div>
                <div className="flex gap-2"><span className="text-muted-foreground w-28 shrink-0">Carbs:</span><span className="font-medium">{phase.carbs}</span></div>
                <div className="flex gap-2"><span className="text-muted-foreground w-28 shrink-0">Protein:</span><span className="font-medium">{phase.protein}</span></div>
                <div className="flex gap-2"><span className="text-muted-foreground w-28 shrink-0">Fat:</span><span className="font-medium">{phase.fat}</span></div>
              </div>
            </div>

            <div className="bg-white/70 rounded-xl p-4 text-sm">
              <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-2">Training</p>
              <p className="text-xs">{phase.training}</p>
            </div>

            <div className="bg-white/70 rounded-xl p-4 text-sm">
              <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-2">Best foods</p>
              <div className="flex flex-wrap gap-1.5">
                {phase.foods.map((f) => (
                  <span key={f} className="text-xs bg-white border border-border rounded-full px-2 py-0.5 text-foreground">{f}</span>
                ))}
              </div>
            </div>

            <div className="bg-white/70 rounded-xl p-4">
              <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-2">Key tips</p>
              <ul className="space-y-1.5">
                {phase.tips.map((tip, i) => (
                  <li key={i} className="text-xs flex gap-2">
                    <span className="shrink-0 text-primary">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-6 text-center">
        Cycle length varies. These day ranges assume a 28-day cycle — adjust proportionally for your own cycle. This guide does not apply during pregnancy.
      </p>
    </PageContainer>
  );
}
