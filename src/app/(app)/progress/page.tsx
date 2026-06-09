import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import DailyCheckIn from "@/models/DailyCheckIn";
import { getUserContext } from "@/lib/userContext";
import { getMacroAdherence } from "@/lib/macroAdherence";
import { buildCoachingSnapshot } from "@/lib/coachingContext";
import { ProgressView } from "@/components/ProgressView";
import User from "@/models/User";
import { isProActive } from "@/lib/billing";

export default async function ProgressPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();
  const [checkInDocs, context, snapshot, user] = await Promise.all([
    DailyCheckIn.find({ userId: session.user.id }).sort({ date: -1 }).limit(60).lean(),
    getUserContext(session.user.id),
    buildCoachingSnapshot(session.user.id),
    User.findById(session.user.id).select("planTier subscriptionStatus").lean(),
  ]);

  const isPro = isProActive(user?.planTier, user?.subscriptionStatus);

  const adherence = context?.macros
    ? await getMacroAdherence(session.user.id, {
        calories: context.macros.calories,
        proteinG: context.macros.proteinG,
        carbsG: context.macros.carbsG,
        fatG: context.macros.fatG,
      })
    : null;

  const checkIns = [...checkInDocs].reverse().map((c) => ({
    date: c.date.toISOString(),
    weightLbs: c.weightLbs,
    compliance: c.compliance,
    energy: c.energy,
    hunger: c.hunger,
    steps: c.steps,
    workoutCompleted: c.workoutCompleted,
  }));

  return (
    <ProgressView
      checkIns={checkIns}
      stats={context?.stats ?? null}
      gam={context?.gamification ?? null}
      adherence={adherence}
      estimatedExpenditure={snapshot?.estimatedExpenditure ?? null}
      isPro={isPro}
    />
  );
}
