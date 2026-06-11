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
  const validated = validateCoachMessage(body.message);
  if ("error" in validated) {
    return new Response(JSON.stringify({ error: validated.error }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
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

  coachSession.messages.push({ role: "user", content: validated.message });
  const apiMessages = coachSession.messages.map((m: ICoachMessage) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY is not set on this deployment." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

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
        controller.close();
      } catch (err) {
        const classified = logAiError({ route: "/api/coach", provider: "anthropic" }, err);
        const raw = err instanceof Error ? err.message : String(err);
        controller.enqueue(
          encoder.encode(`\n\n[Error: ${classified.userMessage} | debug: ${raw}]`)
        );
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
