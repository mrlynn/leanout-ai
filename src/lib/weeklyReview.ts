import Anthropic from "@anthropic-ai/sdk";
import { buildCoachingSnapshot } from "./coachingContext";

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export function getWeekStart(date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

export async function generateWeeklyReview(userId: string) {
  const snapshot = await buildCoachingSnapshot(userId);
  if (!snapshot) return null;

  const s = snapshot;
  const context = `
User: ${s.user.name}
Goal: ${s.user.goalType ?? "not set"}${s.goalDays != null ? `, ${s.goalDays} days to goal` : ""}
Weight trend (14d): ${s.weightTrend != null ? `${s.weightTrend > 0 ? "+" : ""}${s.weightTrend.toFixed(1)} lbs` : "insufficient data"}
Avg compliance (14d): ${s.avgCompliance != null ? `${Math.round(s.avgCompliance * 100)}%` : "n/a"}
Workouts last 7d: ${s.workoutsLast7}
Macro adherence: protein ${s.adherence?.proteinHitRate ?? 0}%, calories ${s.adherence?.calorieHitRate ?? 0}%
Estimated expenditure: ${s.estimatedExpenditure ?? "n/a"} kcal
Today's intake: ${s.todayIntake.calories} kcal
Target macros: ${s.macros?.calories ?? "?"} kcal, ${s.macros?.proteinG ?? "?"}g P
`.trim();

  const anthropic = getAnthropic();
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 800,
    messages: [
      {
        role: "user",
        content: `You are a physique coach writing a weekly review for your client. Be direct, encouraging, and specific. Use markdown.

${context}

Respond with JSON only:
{
  "headline": "short motivating headline (max 8 words)",
  "content": "markdown body with 3 sections: ## What went well, ## What to adjust, ## This week's focus. 2-3 bullets each. Under 300 words total."
}`,
      },
    ],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]) as { headline: string; content: string };
    return {
      headline: parsed.headline,
      content: parsed.content,
      weekStart: getWeekStart(),
    };
  } catch {
    return null;
  }
}
