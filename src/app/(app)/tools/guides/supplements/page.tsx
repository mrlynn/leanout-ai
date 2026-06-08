import { BookOpen } from "lucide-react";

interface Supplement {
  name: string;
  evidence: "A" | "B" | "C" | "D";
  dose: string;
  timing: string;
  bestFor: string[];
  notes: string;
  sideEffects: string;
}

const SUPPLEMENTS: Supplement[] = [
  {
    name: "Creatine Monohydrate",
    evidence: "A",
    dose: "3–5g/day",
    timing: "Any time — consistency matters more than timing",
    bestFor: ["Strength", "Muscle gain", "Performance"],
    notes: "Most studied supplement in existence. Increases phosphocreatine stores for ATP regeneration. Works for ~70% of people.",
    sideEffects: "Mild water retention (intracellular). Rare GI issues. Safe long-term.",
  },
  {
    name: "Caffeine",
    evidence: "A",
    dose: "3–6 mg/kg body weight",
    timing: "30–60 min pre-workout or pre-task",
    bestFor: ["Performance", "Fat loss", "Focus"],
    notes: "Increases endurance, strength output, and fat oxidation. Tolerance builds quickly — cycle on/off.",
    sideEffects: "Anxiety, insomnia if taken late. Dependence with regular use.",
  },
  {
    name: "Protein Powder (Whey/Casein)",
    evidence: "A",
    dose: "20–40g per serving",
    timing: "Post-workout, or any time to hit daily protein target",
    bestFor: ["Muscle gain", "Recovery", "Convenience"],
    notes: "Not magic — it's just food protein. Only useful if you can't hit protein targets from whole foods.",
    sideEffects: "GI discomfort in lactose-sensitive individuals. Use plant-based alternatives if needed.",
  },
  {
    name: "Vitamin D3",
    evidence: "A",
    dose: "1,000–4,000 IU/day",
    timing: "With a fat-containing meal",
    bestFor: ["Health", "Immune function", "Mood", "Testosterone (if deficient)"],
    notes: "~70% of people are deficient. Affects hundreds of biological processes. Test your levels before megadosing.",
    sideEffects: "Toxicity at very high doses (>10,000 IU/day long-term). Take with K2 if supplementing long-term.",
  },
  {
    name: "Omega-3 (Fish Oil)",
    evidence: "A",
    dose: "1–3g EPA+DHA/day",
    timing: "With meals",
    bestFor: ["Health", "Inflammation", "Brain health", "Heart health"],
    notes: "Look at EPA+DHA on the label, not total fish oil. Krill oil is more bioavailable but pricier.",
    sideEffects: "Fishy aftertaste. Minor blood thinning at high doses. Freeze capsules to reduce burps.",
  },
  {
    name: "Magnesium",
    evidence: "B",
    dose: "200–400mg/day (glycinate or malate form)",
    timing: "Before bed",
    bestFor: ["Sleep", "Recovery", "Stress", "Muscle function"],
    notes: "~50% of people are deficient due to soil depletion. Glycinate and malate are better absorbed than oxide.",
    sideEffects: "Loose stools at high doses (oxide form is worst). Generally very safe.",
  },
  {
    name: "Beta-Alanine",
    evidence: "B",
    dose: "3.2–6.4g/day",
    timing: "Pre-workout",
    bestFor: ["Endurance", "High-rep training", "Performance"],
    notes: "Buffers lactic acid. Works best for efforts of 1–4 minutes. Causes harmless tingling (paresthesia).",
    sideEffects: "Tingling/flushing (paresthesia) — harmless, fades with regular use.",
  },
  {
    name: "Citrulline Malate",
    evidence: "B",
    dose: "6–8g",
    timing: "30–60 min pre-workout",
    bestFor: ["Performance", "Pump", "Endurance"],
    notes: "Better than arginine for NO production. Reduces fatigue markers. Often found in pre-workouts.",
    sideEffects: "Generally well tolerated. Possible GI discomfort at very high doses.",
  },
  {
    name: "Zinc",
    evidence: "B",
    dose: "15–30mg/day",
    timing: "With food",
    bestFor: ["Immune function", "Testosterone (if deficient)", "Recovery"],
    notes: "Athletes often deplete zinc through sweat. Don't exceed 40mg/day (UL). Take away from copper if supplementing both.",
    sideEffects: "Nausea on empty stomach. High doses reduce copper absorption.",
  },
  {
    name: "Ashwagandha (KSM-66)",
    evidence: "B",
    dose: "300–600mg/day",
    timing: "With food, morning or night",
    bestFor: ["Stress", "Cortisol", "Recovery", "Testosterone support"],
    notes: "Adaptogen with solid evidence for cortisol reduction and modest testosterone support. KSM-66 is the best-studied extract.",
    sideEffects: "Rare GI issues. Avoid in thyroid conditions. Cycle 8–12 weeks on, 4 off.",
  },
  {
    name: "L-Theanine",
    evidence: "B",
    dose: "100–200mg",
    timing: "With caffeine (1:2 ratio) or before bed",
    bestFor: ["Focus", "Sleep", "Stress"],
    notes: "Synergistic with caffeine — sharpens focus while reducing jitteriness. Promotes relaxed alertness.",
    sideEffects: "Extremely safe. No known interactions at normal doses.",
  },
  {
    name: "Collagen Peptides",
    evidence: "C",
    dose: "10–15g",
    timing: "15 min before training (with vitamin C)",
    bestFor: ["Joint health", "Tendons", "Skin"],
    notes: "Emerging evidence for joint and tendon support when timed with training. Less useful as a muscle-building protein source.",
    sideEffects: "Generally safe. Not a complete protein source.",
  },
  {
    name: "HMB",
    evidence: "C",
    dose: "3g/day",
    timing: "Split across meals",
    bestFor: ["Muscle retention (cutting)", "Beginners"],
    notes: "A metabolite of leucine. Evidence is mixed and largely funded by industry. Most experienced lifters won't notice a difference.",
    sideEffects: "Well tolerated. Expensive for uncertain benefit.",
  },
  {
    name: "BCAAs",
    evidence: "D",
    dose: "5–10g",
    timing: "Intra-workout",
    bestFor: ["Fasted training"],
    notes: "Redundant if you hit protein targets from food or whey. Whole protein sources already contain BCAAs. Skip unless training truly fasted.",
    sideEffects: "Safe but likely wasteful of money for most people.",
  },
  {
    name: "CLA (Conjugated Linoleic Acid)",
    evidence: "D",
    dose: "3–6g/day",
    timing: "With meals",
    bestFor: ["Marketed for fat loss"],
    notes: "Human evidence does not support meaningful fat loss. Animal studies used doses far too high to replicate. Save your money.",
    sideEffects: "Can worsen insulin sensitivity at high doses.",
  },
];

const EVIDENCE_CONFIG: Record<string, { label: string; color: string; bg: string; desc: string }> = {
  A: { label: "A — Strong", color: "text-green-700", bg: "bg-green-100 border-green-300", desc: "Multiple high-quality studies. Consistent benefit proven." },
  B: { label: "B — Good", color: "text-blue-700", bg: "bg-blue-100 border-blue-300", desc: "Several studies support. Some inconsistency in literature." },
  C: { label: "C — Mixed", color: "text-amber-700", bg: "bg-amber-100 border-amber-300", desc: "Limited or conflicting evidence. May work for some." },
  D: { label: "D — Weak", color: "text-red-700", bg: "bg-red-100 border-red-300", desc: "Minimal or no convincing human evidence." },
};

export default function SupplementsGuidePage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl border border-border bg-muted/40 flex items-center justify-center text-xl">
          💊
        </div>
        <div>
          <h1 className="text-2xl font-bold">Supplement Evidence Guide</h1>
          <p className="text-sm text-muted-foreground">
            Evidence ratings for the top 15 supplements — so you know what&apos;s worth it.
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 mb-6 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-4 h-4 text-primary" />
          <span className="font-bold text-sm">Evidence rating scale</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(EVIDENCE_CONFIG).map(([grade, config]) => (
            <div key={grade} className={`rounded-lg border px-3 py-2 ${config.bg}`}>
              <span className={`text-xs font-bold ${config.color}`}>{config.label}</span>
              <p className={`text-xs mt-0.5 ${config.color} opacity-80`}>{config.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {SUPPLEMENTS.map((s) => {
          const ec = EVIDENCE_CONFIG[s.evidence];
          return (
            <div key={s.name} className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-bold text-foreground">{s.name}</h2>
                <span className={`shrink-0 text-xs font-bold px-2 py-1 rounded-full border ${ec.bg} ${ec.color}`}>
                  {ec.label}
                </span>
              </div>

              <p className="text-sm text-muted-foreground">{s.notes}</p>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="font-semibold text-foreground mb-0.5">Dose</p>
                  <p className="text-muted-foreground">{s.dose}</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="font-semibold text-foreground mb-0.5">Timing</p>
                  <p className="text-muted-foreground">{s.timing}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {s.bestFor.map((tag) => (
                  <span key={tag} className="text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="text-xs text-muted-foreground border-t border-border pt-2">
                <span className="font-semibold text-foreground">Side effects: </span>
                {s.sideEffects}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground mt-6 text-center">
        This guide is for educational purposes only. Consult a healthcare provider before starting any supplement regimen.
      </p>
    </div>
  );
}
