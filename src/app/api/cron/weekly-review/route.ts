import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import WeeklyReport from "@/models/WeeklyReport";
import { generateWeeklyReview, getWeekStart } from "@/lib/weeklyReview";
import { isProActive } from "@/lib/billing";
import { sendEmail, emailShell } from "@/lib/email";
import { getAppUrl } from "@/lib/billing";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const weekStart = getWeekStart();
  const proUsers = await User.find({
    onboardingComplete: true,
    planTier: "pro",
    subscriptionStatus: { $in: ["active", "trialing"] },
  })
    .select("email name subscriptionStatus")
    .lean();

  let generated = 0;
  let emailed = 0;

  for (const user of proUsers) {
    if (!isProActive("pro", user.subscriptionStatus)) continue;

    const existing = await WeeklyReport.findOne({ userId: user._id, weekStart }).lean();
    if (existing) continue;

    const review = await generateWeeklyReview(user._id.toString());
    if (!review) continue;

    await WeeklyReport.create({
      userId: user._id,
      weekStart: review.weekStart,
      headline: review.headline,
      content: review.content,
    });
    generated++;

    if (user.email) {
      const sent = await sendEmail({
        to: user.email,
        subject: `Your weekly review: ${review.headline}`,
        html: emailShell(
          "Weekly AI Review",
          `<h2 style="margin:0 0 12px;font-size:18px;">${review.headline}</h2>
           <div style="color:#374151;font-size:14px;line-height:1.6;">${review.content.replace(/\n/g, "<br>")}</div>
           <p style="margin-top:20px;"><a href="${getAppUrl()}/progress" style="color:#f97316;font-weight:600;">View in app →</a></p>`
        ),
      });
      if (sent) {
        await WeeklyReport.updateOne(
          { userId: user._id, weekStart },
          { emailSentAt: new Date() }
        );
        emailed++;
      }
    }
  }

  return NextResponse.json({ weekStart, candidates: proUsers.length, generated, emailed });
}
