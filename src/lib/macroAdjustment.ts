import Anthropic from "@anthropic-ai/sdk";
import { buildCoachingSnapshot } from "./coachingContext";
import { macrosFromUser } from "./physique";
import User from "@/models/User";

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export interface MacroSuggestion {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  rationale: string;
}

export async function generateMacroSuggestion(userId: string): Promise<MacroSuggestion | null> {
  const snapshot = await buildCoachingSnapshot(userId);
  if (!snapshot?.macros) return null;

  const anthropic = getAnthropic();
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: `Suggest a macro adjustment for this user. Ground in data, be conservative (max 150 kcal change).

Current targets: ${snapshot.macros.calories} kcal, ${snapshot.macros.proteinG}g P, ${snapshot.macros.carbsG}g C, ${snapshot.macros.fatG}g F
Goal: ${snapshot.user.goalType}
Weight trend 14d: ${snapshot.weightTrend ?? "unknown"} lbs
Estimated expenditure: ${snapshot.estimatedExpenditure ?? "unknown"}
Protein hit rate: ${snapshot.adherence?.proteinHitRate ?? 0}%
Calorie hit rate: ${snapshot.adherence?.calorieHitRate ?? 0}%

JSON only:
{"calories":number,"proteinG":number,"carbsG":number,"fatG":number,"rationale":"1-2 sentences"}`,
      },
    ],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    return JSON.parse(jsonMatch[0]) as MacroSuggestion;
  } catch {
    return null;
  }
}

export async function saveMacroSuggestion(userId: string, suggestion: MacroSuggestion) {
  await User.findByIdAndUpdate(userId, {
    suggestedCalories: suggestion.calories,
    suggestedProteinG: suggestion.proteinG,
    suggestedCarbsG: suggestion.carbsG,
    suggestedFatG: suggestion.fatG,
    macroSuggestionAt: new Date(),
  });
}

export async function applyMacroSuggestion(userId: string) {
  const user = await User.findById(userId).lean();
  if (!user?.suggestedCalories) return null;

  await User.findByIdAndUpdate(userId, {
    macroOverrideCalories: user.suggestedCalories,
    macroOverrideProteinG: user.suggestedProteinG,
    macroOverrideCarbsG: user.suggestedCarbsG,
    macroOverrideFatG: user.suggestedFatG,
  });

  return {
    calories: user.suggestedCalories,
    proteinG: user.suggestedProteinG!,
    carbsG: user.suggestedCarbsG!,
    fatG: user.suggestedFatG!,
  };
}

/** Read current vs suggested for display */
export async function getMacroSuggestionState(userId: string) {
  const user = await User.findById(userId).lean();
  if (!user) return null;
  const current = macrosFromUser(user);
  if (!user.suggestedCalories) return { current, suggestion: null };
  return {
    current,
    suggestion: {
      calories: user.suggestedCalories,
      proteinG: user.suggestedProteinG!,
      carbsG: user.suggestedCarbsG!,
      fatG: user.suggestedFatG!,
      suggestedAt: user.macroSuggestionAt,
    },
  };
}
