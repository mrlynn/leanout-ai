import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import AccountabilityShare from "@/models/AccountabilityShare";
import { isProActive } from "@/lib/billing";
import { sendEmail, emailShell } from "@/lib/email";
import { getAppUrl } from "@/lib/billing";
import { sendPushToUser } from "@/lib/pushNotifications";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentHour = new Date().getUTCHours();

  const users = await User.find({
    onboardingComplete: true,
    remindersEnabled: { $ne: false },
  })
    .select("email name currentStreak lastCheckInDate reminderHour planTier subscriptionStatus")
    .lean();

  const due = users.filter((u) => {
    const last = u.lastCheckInDate ? new Date(u.lastCheckInDate) : null;
    last?.setHours(0, 0, 0, 0);
    if (last && last.getTime() === today.getTime()) return false;
    const hour = u.reminderHour ?? 20;
    return hour === currentHour;
  });

  let emailsSent = 0;
  let partnerNotified = 0;
  let pushSent = 0;

  for (const u of due) {
    const streak = u.currentStreak ?? 0;
    const pushTitle = streak > 0 ? `Keep your ${streak}-day streak` : "Daily check-in";
    const pushBody = streak > 0 ? "Log today's check-in before midnight." : "30 seconds — weight, energy, compliance.";
    pushSent += await sendPushToUser(u._id.toString(), {
      title: pushTitle,
      body: pushBody,
      url: "/check-in",
    });

    const isPro = isProActive(u.planTier, u.subscriptionStatus);
    if (isPro && u.email) {
      const sent = await sendEmail({
        to: u.email,
        subject: streak > 0 ? `Don't break your ${streak}-day streak!` : "Time for your daily check-in",
        html: emailShell(
          "Check-in reminder",
          `<p style="font-size:15px;color:#374151;">Hey ${u.name?.split(" ")[0] ?? "there"}, you haven't checked in today.</p>
           <p style="font-size:14px;color:#6b7280;">${streak > 0 ? `Your ${streak}-day streak is on the line.` : "Log your weight and how you're feeling — it takes 30 seconds."}</p>
           <p style="margin-top:20px;"><a href="${getAppUrl()}/check-in" style="display:inline-block;background:#f97316;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600;">Check in now</a></p>`
        ),
      });
      if (sent) emailsSent++;

      const share = await AccountabilityShare.findOne({
        userId: u._id,
        revokedAt: null,
        notifyPartner: true,
        partnerEmail: { $exists: true, $ne: "" },
      }).lean();

      if (share?.partnerEmail) {
        const pSent = await sendEmail({
          to: share.partnerEmail,
          subject: `${u.name?.split(" ")[0] ?? "Your partner"} missed their check-in`,
          html: emailShell(
            "Accountability nudge",
            `<p style="font-size:14px;color:#374151;">${u.name?.split(" ")[0] ?? "Your accountability partner"} hasn't checked in today. A quick nudge might help!</p>`
          ),
        });
        if (pSent) partnerNotified++;
      }
    }
  }

  return NextResponse.json({
    checked: users.length,
    remindersDue: due.length,
    emailsSent,
    pushSent,
    partnerNotified,
    proOnlyEmail: true,
  });
}
