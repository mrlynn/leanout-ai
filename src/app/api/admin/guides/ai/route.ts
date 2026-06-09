import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";

function isAdmin(email?: string | null) {
  return email && email === process.env.ADMIN_EMAIL;
}

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const SYSTEM = `You are an expert fitness and nutrition content writer for LeanOut AI, a science-based diet coaching app. You write clear, authoritative, well-structured guides for people working on fat loss, muscle building, and nutrition.

Your writing style:
- Direct and evidence-based — cite mechanisms, not just rules
- Practical: always include actionable takeaways
- Conversational but credible — not bro-science, not dry academic
- Use Markdown: ## headings, **bold** for key terms, bullet lists for reference content, numbered lists for steps
- Ideal length for a guide: 400–900 words
- Never use filler phrases like "In conclusion" or "It's important to note"
- Do not wrap the output in a code block — return raw Markdown only`;

type Action = "generate" | "improve" | "custom";

function buildPrompt(action: Action, title: string, summary: string, category: string, content: string, instruction: string): string {
  if (action === "generate") {
    return `Write a complete guide with the following details:

Title: ${title}
Summary: ${summary || "(none)"}
Category: ${category || "General"}

Write the full guide content in Markdown. Start directly with the first heading or paragraph — do not repeat the title.`;
  }

  if (action === "improve") {
    return `Improve the following guide. Fix grammar, strengthen the writing, improve flow, and make sure the structure is clear. Keep the same content and length — do not add major new sections unless something critical is missing.

Title: ${title}
---
${content}`;
  }

  // custom
  return `You are editing the following guide. Apply this instruction to the content and return the full revised guide.

Instruction: ${instruction}

Title: ${title}
---
${content}`;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return new Response("Forbidden", { status: 403 });
  }

  const { action, title, summary, category, content, instruction } = await req.json() as {
    action: Action;
    title: string;
    summary?: string;
    category?: string;
    content?: string;
    instruction?: string;
  };

  if (!action || !title) {
    return new Response("Missing required fields", { status: 400 });
  }

  const userPrompt = buildPrompt(action, title, summary ?? "", category ?? "General", content ?? "", instruction ?? "");

  const anthropic = getAnthropic();
  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: SYSTEM,
    messages: [{ role: "user", content: userPrompt }],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
