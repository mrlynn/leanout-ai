"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  Brain,
  Code2,
  Dumbbell,
  Heart,
  Lightbulb,
  Mic,
  ScanBarcode,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

const pillars = [
  {
    icon: Dumbbell,
    title: "Daily Athlete",
    body: "Fitness isn't a phase — it's a lifestyle. Working out every single day isn't about punishment; it's about showing up for yourself, building discipline, and becoming the strongest version of who you can be.",
    color: "bg-orange-50 text-orange-600",
  },
  {
    icon: Brain,
    title: "AI Builder",
    body: "I've spent my career at the intersection of software and emerging technology. When AI became powerful enough to genuinely understand nutrition and health, I knew it was time to put it to work.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Code2,
    title: "Software Developer",
    body: "I know what good software feels like. Fast, intuitive, and designed around the user — not around the business model. LeanOut was built the way I wished every fitness app was built.",
    color: "bg-violet-50 text-violet-600",
  },
];

const painPoints = [
  { icon: "💸", text: "Expensive subscriptions for basic features" },
  { icon: "😤", text: "Clunky, frustrating interfaces" },
  { icon: "📋", text: "Databases of 10 million foods — and the one you eat daily isn't there" },
  { icon: "🤖", text: "Zero intelligence — just a dumb calorie counter" },
  { icon: "📉", text: "No context for your actual goals or physique" },
  { icon: "🚪", text: "Quit within weeks because it was more work than it was worth" },
];

const features = [
  { icon: Brain, label: "AI Coach", desc: "Contextual coaching that knows your goals, history, and data" },
  { icon: Sparkles, label: "Photo Logging", desc: "Snap a photo — AI identifies the food and estimates macros instantly" },
  { icon: Mic, label: "Voice Logging", desc: "Say what you ate naturally — AI handles the rest" },
  { icon: ScanBarcode, label: "Barcode Scan", desc: "Scan any packaged food and get instant nutrition data" },
  { icon: Zap, label: "Smart Meal Plans", desc: "Weekly plans generated to hit your exact calorie and macro targets" },
  { icon: Activity, label: "Premium Tools", desc: "Adaptive TDEE, reverse dieting, periodization — all free" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="gradient-orange px-6 pt-10 pb-20 md:pt-14">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-orange-200 text-sm font-semibold uppercase tracking-widest mb-3">The story behind</p>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            LeanOut AI
          </h1>
          <p className="text-orange-100 mt-4 text-lg leading-relaxed max-w-lg mx-auto">
            Built by a fitness junkie who got tired of fitness apps that didn&apos;t work.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 -mt-12 pb-16 space-y-8">

        {/* Founder card */}
        <div className="bg-white rounded-3xl card-shadow-md overflow-hidden">
          <div className="p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="shrink-0">
              <div className="rounded-2xl overflow-hidden ring-4 ring-orange-100 shadow-lg">
                <Image
                  src="/michael.jpg"
                  alt="Michael Lynn"
                  width={112}
                  height={112}
                  className="object-cover w-28 h-28"
                  priority
                  unoptimized
                />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-1">Founder</p>
              <h2 className="text-2xl font-black tracking-tight">Michael Lynn</h2>
              <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
                Software developer · AI practitioner · Daily athlete
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {["Fitness", "AI / ML", "Full-Stack Dev", "Nutrition Nerd"].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-bold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-border px-8 py-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              I work out every single day. Not because I have to — because it&apos;s become as automatic as brushing my teeth.
              Over the years I&apos;ve dialed in training, sleep, recovery. But{" "}
              <span className="text-foreground font-semibold">nutrition was always the missing piece.</span>
            </p>
            <p>
              I&apos;m an intuitive eater by nature, and for a long time I told myself that was fine. But the data didn&apos;t lie —
              my results plateaued, and I knew why. I just wasn&apos;t tracking what I ate. Not even close.
            </p>
            <p>
              So I tried the apps. All of them. And every single one{" "}
              <span className="text-foreground font-semibold">let me down in a different way</span> — too expensive, too clunky,
              too dumb. I&apos;d log food for a week and then quit out of pure frustration.
            </p>
            <p>
              That&apos;s when I decided to build the app I actually wanted to use.
            </p>
          </div>
        </div>

        {/* Three pillars */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">What I bring to this</p>
          {pillars.map(({ icon: Icon, title, body, color }) => (
            <div key={title} className="bg-white rounded-2xl card-shadow p-5 flex gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="font-bold text-sm">{title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pain points */}
        <div className="bg-white rounded-3xl card-shadow-md p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
              <Heart size={18} className="text-red-500" />
            </div>
            <div>
              <p className="font-black">The Problem With Every Other App</p>
              <p className="text-xs text-muted-foreground">What drove me to build something better</p>
            </div>
          </div>
          <div className="space-y-3">
            {painPoints.map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm">
                <span className="text-xl w-8 shrink-0 text-center">{icon}</span>
                <span className="text-muted-foreground">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* The solution */}
        <div className="bg-white rounded-3xl card-shadow-md p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
              <Lightbulb size={18} className="text-orange-500" />
            </div>
            <p className="font-black">So I Built LeanOut</p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            The app I wished existed — fast, intelligent, and actually enjoyable to use.
            Logging food should take seconds, not minutes. Your coach should know your goals.
            And the tools you need to dial in your nutrition shouldn&apos;t cost $60/month.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex gap-3 p-3 rounded-xl bg-muted/40">
                <div className="w-8 h-8 rounded-lg gradient-orange flex items-center justify-center shrink-0">
                  <Icon size={15} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold">{label}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mission */}
        <div className="rounded-3xl gradient-orange p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
            <Target size={24} className="text-white" />
          </div>
          <h3 className="text-white font-black text-xl mb-3">Built for People Like You</h3>
          <p className="text-orange-100 text-sm leading-relaxed max-w-sm mx-auto">
            If you care about your health, work hard in the gym, but struggle with the nutrition side —
            LeanOut AI was made for you. You shouldn&apos;t need a spreadsheet or a dietitian to eat right.
            You just need the right tool.
          </p>
          <Link
            href="/dashboard"
            className="inline-block mt-6 px-6 py-3 bg-white text-orange-600 font-bold rounded-2xl text-sm hover:bg-orange-50 transition-colors shadow-md"
          >
            Start tracking →
          </Link>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground pb-4">
          Core features are free forever — check-ins, logging, progress, and calculators.{" "}
          <Link href="/pricing" className="text-primary font-semibold hover:underline">LeanOut Pro</Link> unlocks unlimited AI coaching and automation. Built with care by someone who actually trains.
        </p>
      </div>
    </div>
  );
}
