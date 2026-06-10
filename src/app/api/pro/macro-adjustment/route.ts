import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requirePro } from "@/lib/planTier";
import {
  generateMacroSuggestion,
  saveMacroSuggestion,
  applyMacroSuggestion,
  getMacroSuggestionState,
} from "@/lib/macroAdjustment";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const proBlock = await requirePro(session.user.id);
  if (proBlock) return proBlock;

  const state = await getMacroSuggestionState(session.user.id);
  return NextResponse.json(state);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const proBlock = await requirePro(session.user.id);
  if (proBlock) return proBlock;

  const body = await req.json();
  const { action } = body;

  if (action === "apply_direct") {
    const { calories, proteinG, carbsG, fatG } = body;
    if (
      typeof calories !== "number" ||
      typeof proteinG !== "number" ||
      typeof carbsG !== "number" ||
      typeof fatG !== "number"
    ) {
      return NextResponse.json({ error: "Invalid macro values" }, { status: 400 });
    }
    const { connectDB } = await import("@/lib/mongodb");
    const User = (await import("@/models/User")).default;
    await connectDB();
    await User.findByIdAndUpdate(session.user.id, {
      macroOverrideCalories: calories,
      macroOverrideProteinG: proteinG,
      macroOverrideCarbsG: carbsG,
      macroOverrideFatG: fatG,
      suggestedCalories: calories,
      suggestedProteinG: proteinG,
      suggestedCarbsG: carbsG,
      suggestedFatG: fatG,
      macroSuggestionAt: new Date(),
    });
    return NextResponse.json({ applied: { calories, proteinG, carbsG, fatG } });
  }

  if (action === "generate") {
    const suggestion = await generateMacroSuggestion(session.user.id);
    if (!suggestion) return NextResponse.json({ error: "Could not generate suggestion" }, { status: 500 });
    await saveMacroSuggestion(session.user.id, suggestion);
    return NextResponse.json({ suggestion });
  }

  if (action === "apply") {
    const applied = await applyMacroSuggestion(session.user.id);
    if (!applied) return NextResponse.json({ error: "No suggestion to apply" }, { status: 400 });
    return NextResponse.json({ applied });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
