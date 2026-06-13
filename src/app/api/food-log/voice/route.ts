import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import FoodLogEntry from "@/models/FoodLogEntry";
import { checkUsage } from "@/lib/usageLimits";
import { logLimitReached } from "@/lib/limitReached";
import { aiErrorResponse } from "@/lib/aiError";
import { macrosFromUser } from "@/lib/physique";
import { gradeFoodItem } from "@/lib/foodGrade";
import { getDateString, aggregateDayTotals } from "@/lib/foodLog";
import type { FoodItem } from "@/lib/foodLog";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const usage = await checkUsage(session.user.id, "voice_log");
  if (!usage.allowed) {
    await logLimitReached(session.user.id, "voice_log");
    return NextResponse.json(
      { error: "limit_reached", feature: "voice_log", used: usage.used, limit: usage.limit, period: usage.period, tier: usage.tier },
      { status: 429 }
    );
  }

  const body = await req.json();
  const description =
    (typeof body.transcript === "string" ? body.transcript : null) ??
    (typeof body.description === "string" ? body.description : null);

  if (!description || description.trim().length === 0) {
    return NextResponse.json({ error: "Description required" }, { status: 400 });
  }
  if (description.length > 2000) {
    return NextResponse.json({ error: "Description too long" }, { status: 400 });
  }

  await connectDB();
  const user = await User.findById(session.user.id).lean();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const dietaryNotes = [
    user.allergies && `Allergies/avoid: ${user.allergies}`,
    user.foodPreferences && `Food preferences: ${user.foodPreferences}`,
  ]
    .filter(Boolean)
    .join(". ");

  const prompt = `The user described what they ate. Extract every food item and estimate its macros.
${dietaryNotes ? `User dietary notes: ${dietaryNotes}. Flag any detected allergens.` : ""}

User said: "${description.trim()}"

Return ONLY valid JSON (no markdown):
{
  "foods": [
    { "name": "food name", "quantity": "estimated portion", "calories": 0, "protein": 0, "carbs": 0, "fat": 0 }
  ],
  "mealType": "breakfast|lunch|dinner|snack",
  "confidence": "high|medium|low",
  "notes": "optional caveat about assumptions or unclear items"
}

Rules:
- Parse every distinct food item mentioned separately
- Infer reasonable portion sizes if not stated (e.g. "a sandwich" = 1 sandwich ~300 cal)
- If quantities are stated (e.g. "two eggs", "large coffee with oat milk"), use them
- Set confidence to "low" if the description is vague or portions are unclear
- Infer mealType from context clues (time of day mentioned, food types, etc.) — default "snack"
- All numeric fields must be non-negative numbers`;

  let raw: string;
  try {
    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });
    raw = completion.choices[0].message.content ?? "{}";
  } catch (err) {
    return aiErrorResponse({ route: "/api/food-log/voice", provider: "openai" }, err);
  }
  let result: {
    foods?: { name: string; quantity: string; calories: number; protein: number; carbs: number; fat: number }[];
    mealType?: string;
    confidence?: string;
    notes?: string;
  };

  try {
    result = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }

  if (!result.foods?.length) {
    return NextResponse.json({ error: "No foods detected in description" }, { status: 422 });
  }

  // Compute grade for each food item (best-effort)
  let foodsWithGrades = result.foods as (typeof result.foods[0] & { grade?: ReturnType<typeof gradeFoodItem> })[];
  try {
    const [todayEntries] = await Promise.all([
      FoodLogEntry.find({ userId: session.user.id, date: getDateString() }).lean(),
    ]);
    const macros = macrosFromUser(user);
    if (macros) {
      const dayTotals = aggregateDayTotals(todayEntries as { foods: FoodItem[] }[]);
      const goals = { calories: macros.calories, proteinG: macros.proteinG, carbsG: macros.carbsG, fatG: macros.fatG, goalType: user.goalType };
      foodsWithGrades = result.foods!.map((f) => ({
        ...f,
        grade: gradeFoodItem(f as FoodItem, goals, dayTotals),
      }));
    }
  } catch {
    // Grading is best-effort
  }

  await usage.record();
  return NextResponse.json({
    foods: foodsWithGrades,
    mealType: result.mealType ?? "snack",
    confidence: result.confidence ?? "medium",
    notes: result.notes,
    usageRemaining: Math.max(0, usage.limit - usage.used - 1),
  });
}
