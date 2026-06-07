import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const MAX_BYTES = 4 * 1024 * 1024;

function parseDataUrl(dataUrl: string): { mime: string; base64: string } | null {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png));base64,(.+)$/);
  if (!match) return null;
  return { mime: match[1], base64: match[2] };
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { image } = await req.json();
  if (!image || typeof image !== "string") {
    return NextResponse.json({ error: "Image required" }, { status: 400 });
  }

  const parsed = parseDataUrl(image);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid image format. Use JPEG or PNG base64 data URL." }, { status: 400 });
  }

  const byteLength = Buffer.byteLength(parsed.base64, "base64");
  if (byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "Image too large (max 4MB)" }, { status: 400 });
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

  const prompt = `Analyze this food photo and estimate what the person ate.
${dietaryNotes ? `User dietary notes: ${dietaryNotes}. Flag any detected allergens.` : ""}

Return ONLY valid JSON (no markdown):
{
  "foods": [
    { "name": "food name", "quantity": "estimated portion", "calories": 0, "protein": 0, "carbs": 0, "fat": 0 }
  ],
  "mealType": "breakfast|lunch|dinner|snack",
  "confidence": "high|medium|low",
  "notes": "optional caveat about portion uncertainty or assumptions"
}

Identify each distinct food item visible. Use reasonable macro estimates for the estimated portions. Set confidence to low if portions are unclear.`;

  const completion = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: image, detail: "low" } },
        ],
      },
    ],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0].message.content ?? "{}";
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
    return NextResponse.json({ error: "No foods detected in image" }, { status: 422 });
  }

  return NextResponse.json({
    foods: result.foods,
    mealType: result.mealType ?? "snack",
    confidence: result.confidence ?? "medium",
    notes: result.notes,
  });
}
