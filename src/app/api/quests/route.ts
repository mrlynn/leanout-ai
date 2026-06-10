import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import QuestAssignment, { IQuestSlot } from "@/models/QuestAssignment";
import { refreshQuestProgress, QUEST_MAP, currentWeekStart } from "@/lib/quests";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const weekStart = currentWeekStart();
  await refreshQuestProgress(session.user.id);

  const assignment = await QuestAssignment.findOne({
    userId: session.user.id,
    weekStart,
  }).lean();

  const quests = (assignment?.quests ?? [] as IQuestSlot[]).map((slot: IQuestSlot) => {
    const def = QUEST_MAP[slot.questId];
    return {
      questId: slot.questId,
      name: def?.name ?? slot.questId,
      description: def?.description(slot.params) ?? "",
      category: def?.category ?? "engagement",
      xpReward: def?.xpReward ?? 0,
      params: slot.params,
      progress: slot.progress,
      target: slot.target,
      completed: !!slot.completedAt,
      completedAt: slot.completedAt ?? null,
    };
  });

  return NextResponse.json({ weekStart, quests });
}
