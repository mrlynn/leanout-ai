import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import DailyCheckIn from "@/models/DailyCheckIn";
import { calculatePhysique, calculateMacros } from "@/lib/calculator";
import type { ActivityLevel } from "@/lib/calculator";
import { checkUsage } from "@/lib/usageLimits";

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const usage = await checkUsage(session.user.id, "coach_message");
  if (!usage.allowed) {
    return new Response(
      JSON.stringify({ error: "limit_reached", feature: "coach_message", used: usage.used, limit: usage.limit, period: usage.period }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  const { messages } = await req.json();

  await connectDB();
  const user = await User.findById(session.user.id).lean();
  if (!user) return new Response("User not found", { status: 404 });

  // Gather recent check-ins for context
  const recentCheckIns = await DailyCheckIn.find({ userId: session.user.id })
    .sort({ date: -1 })
    .limit(14)
    .lean();

  const physique =
    user.weightLbs && user.bodyFatPercent && user.heightInches && user.age && user.sex && user.activityLevel && user.goalType
      ? calculatePhysique({
          weightLbs: user.weightLbs,
          bodyFatPercent: user.bodyFatPercent,
          heightInches: user.heightInches,
          age: user.age,
          sex: user.sex as "male" | "female",
          activityLevel: user.activityLevel as ActivityLevel,
          goalType: user.goalType as "lose_fat" | "maintain" | "build_muscle",
        })
      : null;

  const macros = physique ? calculateMacros(physique.targetCalories, physique.leanBodyMassLbs) : null;

  const avgWeight =
    recentCheckIns.length > 0
      ? (recentCheckIns.reduce((s, c) => s + c.weightLbs, 0) / recentCheckIns.length).toFixed(1)
      : null;

  const avgCompliance =
    recentCheckIns.length > 0
      ? (recentCheckIns.reduce((s, c) => s + c.compliance, 0) / recentCheckIns.length).toFixed(1)
      : null;

  const weightTrend =
    recentCheckIns.length >= 2
      ? (recentCheckIns[0].weightLbs - recentCheckIns[recentCheckIns.length - 1].weightLbs).toFixed(1)
      : null;

  const systemPrompt = `You are an expert AI physique coach for LeanOut AI. You give direct, data-driven, actionable advice.

CLIENT PROFILE:
- Name: ${user.name}
- Age: ${user.age}, Sex: ${user.sex}
- Current weight: ${user.weightLbs} lbs, Body fat: ${user.bodyFatPercent}%
- Goal: ${user.goalType?.replace("_", " ")} → ${physique?.goalWeightLbs} lbs
- Timeline: ~${physique?.weeksToGoal} weeks
- Lean body mass: ${physique?.leanBodyMassLbs} lbs
- Activity: ${user.activityLevel?.replace(/_/g, " ")}, Training ${user.trainingFrequency}x/week
${user.onTRT ? "- On TRT" : ""}
${user.foodPreferences ? `- Food preferences: ${user.foodPreferences}` : ""}
${user.allergies ? `- Allergies: ${user.allergies}` : ""}

DAILY TARGETS:
- Calories: ${physique?.targetCalories} kcal (maintenance: ${physique?.maintenanceCalories})
- Protein: ${macros?.proteinG}g | Carbs: ${macros?.carbsG}g | Fat: ${macros?.fatG}g
- Target loss: ${physique?.weeklyFatLossLbs} lbs/week

RECENT PROGRESS (last ${recentCheckIns.length} check-ins):
${
  recentCheckIns.length > 0
    ? `- 7-day avg weight: ${avgWeight} lbs
- Weight change over period: ${weightTrend !== null ? (parseFloat(weightTrend) <= 0 ? weightTrend : `+${weightTrend}`) : "N/A"} lbs
- Avg diet compliance: ${avgCompliance}/10
- Latest check-in: ${recentCheckIns[0] ? `${recentCheckIns[0].weightLbs} lbs, compliance ${recentCheckIns[0].compliance}/10, energy ${recentCheckIns[0].energy}/10, hunger ${recentCheckIns[0].hunger}/10` : "none"}`
    : "- No check-ins logged yet"
}

COACHING STYLE:
- Be concise and specific. Use numbers. Skip pleasantries.
- When weight loss has stalled (< 0.3 lbs/week avg), recommend reducing calories by 100-150/day OR adding 20 min cardio 3x/week.
- When compliance is low (<7), focus on adherence strategies before adjusting targets.
- When hunger is high (>7 avg), suggest protein increases or volume eating strategies.
- When energy is low (<5 avg), check if deficit is too aggressive or sleep/recovery is lacking.
- Reference their actual data when giving recommendations.
- Keep responses under 150 words unless a detailed plan is explicitly requested.`;

  const anthropic = getAnthropic();

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
      await usage.record();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
