import { PageContainer } from "@/components/PageContainer";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

const EXAMPLES = [
  {
    profile: "170 lb man, lose fat, moderately active",
    tdee: 2500,
    calories: 2000,
    fat: 156,
    protein: 140,
    carbs: 25,
    color: "bg-blue-50 border-blue-100",
  },
  {
    profile: "140 lb woman, lose fat, lightly active",
    tdee: 1900,
    calories: 1450,
    fat: 107,
    protein: 112,
    carbs: 20,
    color: "bg-rose-50 border-rose-100",
  },
  {
    profile: "190 lb man, maintain muscle, very active",
    tdee: 3100,
    calories: 3100,
    fat: 224,
    protein: 171,
    carbs: 30,
    color: "bg-green-50 border-green-100",
  },
];

const STEPS = [
  {
    n: 1,
    title: "Calculate your TDEE",
    body: "Total Daily Energy Expenditure is your maintenance calorie level — what you burn in a normal day. Use the Calorie Calculator to find yours. If your goal is fat loss, subtract 300–500 calories. If maintenance, use your TDEE directly.",
    link: { href: "/tools/calorie-calculator", label: "Open Calorie Calculator" },
  },
  {
    n: 2,
    title: "Set your carb ceiling",
    body: "For most people, staying under 20–30g net carbs per day reliably induces ketosis. Some people can go up to 50g and stay in ketosis — this varies by individual. Start at 20g if you're new. Net carbs = Total carbs − Fiber.",
    link: null,
  },
  {
    n: 3,
    title: "Calculate protein",
    body: "Aim for 0.7–1.0g of protein per pound of bodyweight (or per pound of lean body mass if you know your body fat %). This preserves muscle during a deficit and keeps you full. On keto, too much protein can slow ketosis via gluconeogenesis — don't go much over 1.0g/lb.",
    link: { href: "/tools/protein", label: "Open Protein Calculator" },
  },
  {
    n: 4,
    title: "Fill the rest with fat",
    body: "Once carbs and protein are set, fat makes up the remaining calories. Fat = (Total calories − protein calories − carb calories) ÷ 9. This is your primary fuel source on keto — don't restrict it.",
    link: null,
  },
];

const TRACKING_TIPS = [
  { tip: "Track net carbs, not total carbs", detail: "Fiber doesn't raise blood sugar. Most keto apps let you toggle net carbs automatically." },
  { tip: "Weigh food for the first 3–4 weeks", detail: "Portion estimation is notoriously inaccurate. A food scale removes the guesswork until you've built intuition." },
  { tip: "Watch for hidden carbs in sauces and dressings", detail: "Ketchup, BBQ sauce, teriyaki, and \"lite\" dressings can blow your carb budget in a tablespoon." },
  { tip: "Log everything — including cooking oils", detail: "Fat calories add up fast. A tablespoon of olive oil is 120 calories." },
  { tip: "Re-evaluate macros every 4–6 weeks", detail: "As you lose weight, your TDEE and protein needs change. Recalculate when you've lost 10+ lbs." },
];

export default function KetoMacrosPage() {
  return (
    <PageContainer size="content" className="py-8">
      <Link href="/tools" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Tools
      </Link>

      <div className="mb-8">
        <div className="text-4xl mb-3">📊</div>
        <h1 className="text-2xl font-bold">Keto Macros Guide</h1>
        <p className="text-muted-foreground text-sm mt-1">
          How to calculate your personal keto macro targets — step by step.
        </p>
      </div>

      {/* Standard keto split */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm mb-5">
        <h2 className="font-bold text-base mb-3">Standard keto macro targets</h2>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { macro: "Fat", pct: "70–75%", g: "~165g", sub: "per 2,000 cal", color: "bg-blue-50 border-blue-100 text-blue-700" },
            { macro: "Protein", pct: "20–25%", g: "~125g", sub: "per 2,000 cal", color: "bg-red-50 border-red-100 text-red-700" },
            { macro: "Carbs", pct: "5%", g: "<30g", sub: "net carbs / day", color: "bg-amber-50 border-amber-100 text-amber-700" },
          ].map(({ macro, pct, g, sub, color }) => (
            <div key={macro} className={`rounded-xl border p-4 text-center ${color}`}>
              <p className="text-xl font-black">{pct}</p>
              <p className="text-sm font-bold mt-1">{g}</p>
              <p className="text-xs opacity-60 mt-0.5">{sub}</p>
              <p className="text-xs font-semibold mt-1 uppercase tracking-wide opacity-70">{macro}</p>
            </div>
          ))}
        </div>
        <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
          <div className="bg-blue-400 rounded-l-full" style={{ width: "72%" }} />
          <div className="bg-red-400" style={{ width: "23%" }} />
          <div className="bg-amber-400 rounded-r-full" style={{ width: "5%" }} />
        </div>
      </div>

      {/* Step-by-step */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm mb-5">
        <h2 className="font-bold text-base mb-4">Calculate your personal keto macros</h2>
        <div className="space-y-5">
          {STEPS.map(({ n, title, body, link }) => (
            <div key={n} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-black shrink-0 mt-0.5">
                {n}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm mb-1">{title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                {link && (
                  <Link href={link.href} className="inline-block mt-2 text-xs font-semibold text-primary hover:underline">
                    {link.label} →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Formula */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm mb-5">
        <h2 className="font-bold text-base mb-3">The formula</h2>
        <div className="space-y-3">
          {[
            { label: "Net Carbs", formula: "20–30g (fixed ceiling)", color: "text-amber-600" },
            { label: "Protein (g)", formula: "Bodyweight (lbs) × 0.7–1.0", color: "text-red-600" },
            { label: "Protein calories", formula: "Protein (g) × 4", color: "text-red-400" },
            { label: "Carb calories", formula: "Net carbs × 4", color: "text-amber-400" },
            { label: "Fat calories", formula: "Total calories − protein cal − carb cal", color: "text-blue-600" },
            { label: "Fat (g)", formula: "Fat calories ÷ 9", color: "text-blue-600" },
          ].map(({ label, formula, color }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0 text-sm">
              <span className={`font-semibold ${color}`}>{label}</span>
              <code className="bg-muted/60 px-2.5 py-0.5 rounded-lg text-xs font-mono text-foreground">{formula}</code>
            </div>
          ))}
        </div>
      </div>

      {/* Example profiles */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm mb-5">
        <h2 className="font-bold text-base mb-4">Example macro targets</h2>
        <div className="space-y-4">
          {EXAMPLES.map(({ profile, calories, fat, protein, carbs, color }) => (
            <div key={profile} className={`rounded-xl border p-4 ${color}`}>
              <p className="text-xs font-semibold text-muted-foreground mb-3">{profile}</p>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label: "Calories", val: calories, unit: "kcal" },
                  { label: "Fat", val: fat, unit: "g" },
                  { label: "Protein", val: protein, unit: "g" },
                  { label: "Carbs", val: carbs, unit: "g net" },
                ].map(({ label, val, unit }) => (
                  <div key={label}>
                    <p className="text-lg font-black text-foreground">{val}</p>
                    <p className="text-xs text-muted-foreground">{unit}</p>
                    <p className="text-xs font-semibold text-muted-foreground mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tracking tips */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm mb-5">
        <h2 className="font-bold text-base mb-3">Tracking tips that actually matter</h2>
        <div className="space-y-3">
          {TRACKING_TIPS.map(({ tip, detail }) => (
            <div key={tip} className="border border-border rounded-xl p-4">
              <p className="text-sm font-semibold mb-1">✓ {tip}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Signs you're in ketosis */}
      <div className="bg-green-50 border border-green-100 rounded-2xl p-5 shadow-sm mb-5">
        <h2 className="font-bold text-base mb-3 text-green-800">✅ Signs you&apos;re in ketosis</h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            ["Reduced hunger", "Ketones suppress appetite hormones"],
            ["Keto breath", "Acetone on the breath (temporary)"],
            ["Increased urination", "Flushing glycogen-bound water"],
            ["Mental clarity", "Ketones are efficient brain fuel"],
            ["Weight loss (water first)", "Glycogen stores drop first"],
            ["Reduced energy at first", "Normal during adaptation — passes"],
          ].map(([sign, note]) => (
            <div key={sign} className="bg-white/70 rounded-xl px-3 py-2.5 text-xs">
              <p className="font-semibold text-green-800">{sign}</p>
              <p className="text-green-600 mt-0.5">{note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Macro calculator CTA */}
      <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 text-center">
        <p className="text-sm font-semibold mb-3">Ready to calculate your exact keto macros?</p>
        <Link
          href="/tools/macro-calculator"
          className="inline-block bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
        >
          Open Macro Calculator →
        </Link>
      </div>

      <div className="mt-6 flex gap-3">
        <Link href="/tools/guides/keto-101" className="flex-1 bg-card border border-border rounded-xl p-4 text-center text-sm font-semibold hover:border-primary/40 transition-colors">
          🥑 Keto 101 →
        </Link>
        <Link href="/tools/guides/keto-food-list" className="flex-1 bg-card border border-border rounded-xl p-4 text-center text-sm font-semibold hover:border-primary/40 transition-colors">
          🥩 Keto Food List →
        </Link>
      </div>
    </PageContainer>
  );
}
