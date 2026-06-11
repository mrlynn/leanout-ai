import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import CoachSession, { type ICoachMessage } from "@/models/CoachSession";
import { checkUsage } from "@/lib/usageLimits";
import { logLimitReached } from "@/lib/limitReached";
import { validateCoachMessage } from "@/lib/validation";
import { buildCoachSystemPrompt, isCoachContextStale } from "@/lib/coachContext";
import { logAiError } from "@/lib/aiError";

// Vercel default timeout (10–15 s) is too short for a cold-start + streaming
// Anthropic call. Raise it to 60 s (max on Pro; capped at 10 s on Hobby).
export const maxDuration = 60;

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const coachSession = await CoachSession.findOne({ userId: session.user.id }).lean();
  return NextResponse.json({ messages: coachSession?.messages ?? [] });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  await CoachSession.findOneAndUpdate(
    { userId: session.user.id },
    { $set: { messages: [] } }
  );
  return NextResponse.json({ ok: true });
}

async function generateFollowUps(
  anthropic: Anthropic,
  systemPrompt: string,
  messages: { role: "user" | "assistant"; content: string }[]
): Promise<string[]> {
  try {
    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: systemPrompt,
      messages: [
        ...messages,
        {
          role: "user",
          content:
            "Generate exactly 3 short follow-up questions the user might want to ask next, based on the conversation so far. Return only a JSON array of strings, no explanation. Each question max 10 words.",
        },
      ],
    });
    const text = res.content[0].type === "text" ? res.content[0].text : "[]";
    const parsed = JSON.parse(text.match(/\[[\s\S]*\]/)?.[0] ?? "[]") as unknown;
    if (Array.isArray(parsed)) return (parsed as unknown[]).slice(0, 3).map(String);
  } catch {
    // follow-ups are best-effort
  }
  return [];
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const usage = await checkUsage(session.user.id, "coach_message");
  if (!usage.allowed) {
    await logLimitReached(session.user.id, "coach_message");
    return new Response(
      JSON.stringify({ error: "limit_reached", feature: "coach_message", used: usage.used, limit: usage.limit, period: usage.period, tier: usage.tier }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  const body = await req.json();

  // regenerate: pop the last assistant message and re-run
  const isRegenerate = body.regenerate === true;

  const validated = isRegenerate
    ? { message: null }
    : validateCoachMessage(body.message);
  if (!isRegenerate && "error" in validated) {
    return new Response(JSON.stringify({ error: (validated as { error: string }).error }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY is not set on this deployment." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  await connectDB();

  let coachSession = await CoachSession.findOne({ userId: session.user.id });
  if (!coachSession) {
    coachSession = await CoachSession.create({ userId: session.user.id, messages: [] });
  }

  if (!coachSession.systemPrompt || isCoachContextStale(coachSession.contextUpdatedAt)) {
    coachSession.systemPrompt = await buildCoachSystemPrompt(session.user.id);
    coachSession.contextUpdatedAt = new Date();
  }

  if (isRegenerate) {
    // Remove the last assistant message to re-generate it
    const msgs: ICoachMessage[] = coachSession.messages;
    if (msgs.length > 0 && msgs[msgs.length - 1].role === "assistant") {
      coachSession.messages = msgs.slice(0, -1);
    }
  } else {
    coachSession.messages.push({ role: "user", content: (validated as { message: string }).message });
  }

  const apiMessages = coachSession.messages.map((m: ICoachMessage) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const anthropic = getAnthropic();

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: coachSession.systemPrompt,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: apiMessages,
  });

  const encoder = new TextEncoder();
  let assistantText = "";

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            assistantText += chunk.delta.text;
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }

        coachSession!.messages.push({ role: "assistant", content: assistantText });
        await coachSession!.save();
        await usage.record();

        // Generate follow-up suggestions with a fast model (best-effort)
        const followUps = await generateFollowUps(anthropic, coachSession!.systemPrompt, [
          ...apiMessages,
          { role: "assistant", content: assistantText },
        ]);

        // Append as a sentinel JSON line the client parses separately
        if (followUps.length > 0) {
          controller.enqueue(
            encoder.encode(`\n\n__FOLLOWUPS__${JSON.stringify(followUps)}`)
          );
        }

        controller.close();
      } catch (err) {
        const classified = logAiError({ route: "/api/coach", provider: "anthropic" }, err);
        controller.enqueue(
          encoder.encode(`\n\n[Error: ${classified.userMessage}]`)
        );
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
