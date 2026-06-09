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

  const { action } = await req.json();

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
