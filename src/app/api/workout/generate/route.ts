import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import { checkUsage } from "@/lib/usageLimits";
import { logLimitReached } from "@/lib/limitReached";

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const usage = await checkUsage(session.user.id, "workout_generation");
  if (!usage.allowed) {
    await logLimitReached(session.user.id, "workout_generation");
    return NextResponse.json(
      { error: "limit_reached", feature: "workout_generation", used: usage.used, limit: usage.limit, period: usage.period, tier: usage.tier },
      { status: 429 }
    );
  }

  const { goal, preferences } = await req.json();

  const {
    equipment,
    workoutsPerWeek,
    durationMinutes,
    experienceLevel,
    split,
    warmupSets,
    circuits,
  } = preferences;

  const systemPrompt = `You are an expert fitness programming coach with 20+ years of experience creating structured weekly training plans. You create science-based, practical workout programs optimized for the client's goal, equipment, experience level, and schedule. You always return valid JSON with no extra text.`;

  const userPrompt = `Create a complete 7-day weekly workout plan with these specifications:

Goal: ${goal}
Equipment: ${equipment}
Workouts per week: ${workoutsPerWeek}
Session duration: ${durationMinutes} minutes
Experience level: ${experienceLevel}
Training split: ${split}
Include warm-up sets: ${warmupSets}
Include circuits/supersets: ${circuits}

Rules:
- Include exactly 7 days (dayIndex 0=Monday through 6=Sunday)
- Rest days must have isRest:true, focus:"Rest", workoutName:"Rest Day", estimatedMinutes:0, exercises:[]
- Training days must have isRest:false and a full exercise list
- Each training session should fit within ${durationMinutes} minutes
- If warmupSets is true, include 1-2 warm-up exercises per session with isWarmup:true
- If circuits is true, group exercises with notes indicating supersets
- Exercise reps format examples: "8-10", "12-15", "45 sec", "AMRAP", "3x400m"
- Rest format examples: "60 sec", "90 sec", "2-3 min", "30 sec"
- Categories: "strength", "cardio", "mobility", "warmup"
- Distribute workouts evenly across the week; put rest days at the end if possible

Return ONLY valid JSON. No markdown. No explanation. No code fences. Exactly this shape:

{
  "schedule": [
    {
      "dayIndex": 0,
      "dayName": "Monday",
      "isRest": false,
      "focus": "Push",
      "workoutName": "Push Day A — Chest & Shoulders",
      "estimatedMinutes": 60,
      "exercises": [
        {
          "name": "Barbell Bench Press",
          "category": "strength",
          "sets": 4,
          "reps": "6-8",
          "rest": "2-3 min",
          "notes": "Control the eccentric, full range of motion",
          "isWarmup": false
        }
      ]
    }
  ]
}`;

  const anthropic = getAnthropic();

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    let parsed: { schedule: unknown[] };
    try {
      parsed = JSON.parse(text);
    } catch {
      // Try to extract JSON from the response
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
      }
      parsed = JSON.parse(match[0]);
    }

    await usage.record();
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Workout generation error:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
