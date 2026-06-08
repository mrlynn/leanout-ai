import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import MealPlan from "@/models/MealPlan";
import { checkUsage } from "@/lib/usageLimits";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const usage = await checkUsage(session.user.id, "meal_plan");
  if (!usage.allowed) {
    return NextResponse.json(
      { error: "limit_reached", feature: "meal_plan", used: usage.used, limit: usage.limit, period: usage.period },
      { status: 429 }
    );
  }

  await connectDB();
  const user = await User.findById(session.user.id).lean();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { calories, protein, carbs, fat } = await req.json();

  const preferences = [
    user.foodPreferences && `Food preferences: ${user.foodPreferences}`,
    user.allergies && `Allergies/avoid: ${user.allergies}`,
    user.supplements && `Supplements used: ${user.supplements}`,
  ]
    .filter(Boolean)
    .join(". ");

  const prompt = `Create a 7-day meal plan with these exact daily macro targets:
- Calories: ${calories} kcal
- Protein: ${protein}g
- Carbs: ${carbs}g
- Fat: ${fat}g
${preferences ? `\nDietary notes: ${preferences}` : ""}

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "days": [
    {
      "day": "Monday",
      "meals": [
        {
          "name": "Breakfast",
          "foods": [
            { "item": "Food name", "quantity": "amount + unit", "calories": 0, "protein": 0, "carbs": 0, "fat": 0 }
          ],
          "totalCalories": 0,
          "totalProtein": 0,
          "totalCarbs": 0,
          "totalFat": 0
        }
      ],
      "totalCalories": 0,
      "totalProtein": 0,
      "totalCarbs": 0,
      "totalFat": 0
    }
  ],
  "groceryList": {
    "protein": ["item with quantity for the week"],
    "vegetables": [],
    "fruits": [],
    "carbs": [],
    "fats": [],
    "condiments": []
  }
}

Include 3-4 meals per day (breakfast, lunch, dinner, optional snack). Hit the macro targets within 5% each day.`;

  const completion = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0].message.content ?? "{}";
  const parsed = JSON.parse(raw);

  const mealPlan = await MealPlan.create({
    userId: session.user.id,
    startDate: new Date(),
    calories,
    protein,
    carbs,
    fat,
    days: parsed.days,
    groceryList: parsed.groceryList,
  });

  await usage.record();
  return NextResponse.json({ mealPlanId: mealPlan._id.toString(), mealPlan: parsed, usageRemaining: Math.max(0, usage.limit - usage.used - 1) });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const latest = await MealPlan.findOne({ userId: session.user.id }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ mealPlan: latest });
}
