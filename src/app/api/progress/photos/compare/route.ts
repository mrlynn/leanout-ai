import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import ProgressPhoto from "@/models/ProgressPhoto";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { beforeId, afterId, optIn } = await req.json();
  if (!optIn) {
    return NextResponse.json({ error: "AI commentary requires explicit opt-in" }, { status: 400 });
  }
  if (!beforeId || !afterId) {
    return NextResponse.json({ error: "beforeId and afterId required" }, { status: 400 });
  }

  await connectDB();
  const [before, after] = await Promise.all([
    ProgressPhoto.findOne({ _id: beforeId, userId: session.user.id }).lean(),
    ProgressPhoto.findOne({ _id: afterId, userId: session.user.id }).lean(),
  ]);

  if (!before || !after) {
    return NextResponse.json({ error: "Photos not found" }, { status: 404 });
  }

  const imageFor = (p: typeof before) => {
    if (p.blobUrl) return { type: "url" as const, url: p.blobUrl };
    if (p.imageData) return { type: "base64" as const, data: p.imageData };
    return null;
  };

  const beforeImg = imageFor(before);
  const afterImg = imageFor(after);
  if (!beforeImg || !afterImg) {
    return NextResponse.json({ error: "Missing image data" }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const content: Anthropic.MessageCreateParams["messages"][0]["content"] = [
    {
      type: "text",
      text: `Compare these progress photos (${before.date} → ${after.date}). Weight: ${before.weightLbs ?? "?"} → ${after.weightLbs ?? "?"} lbs.
Be encouraging. Note 2-3 observable changes. Never criticize the earlier photo. Never estimate body fat. If change is imperceptible, say so and reference logged effort instead.
JSON: {"headline":"...","observations":["..."],"encouragement":"..."}`,
    },
  ];

  for (const img of [beforeImg, afterImg]) {
    if (img.type === "base64") {
      const media = img.data.startsWith("data:") ? img.data.split(",")[1] : img.data;
      content.push({
        type: "image",
        source: { type: "base64", media_type: "image/jpeg", data: media },
      });
    }
  }

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 400,
    messages: [{ role: "user", content }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: "Could not parse commentary" }, { status: 502 });
  }

  try {
    return NextResponse.json({ commentary: JSON.parse(jsonMatch[0]) });
  } catch {
    return NextResponse.json({ error: "Invalid commentary JSON" }, { status: 502 });
  }
}
