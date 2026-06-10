import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { generateResetToken } from "@/lib/passwordReset";
import { sendEmail, emailShell } from "@/lib/email";
import { getAppUrl } from "@/lib/billing";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const normalized = email.toLowerCase().trim();
  const rate = await checkRateLimit(`forgot:${normalized}`, 3, 60 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  await connectDB();
  const user = await User.findOne({ email: normalized });
  if (user && user.password) {
    const { token, hash, expires } = generateResetToken();
    user.passwordResetHash = hash;
    user.passwordResetExpires = expires;
    await user.save();

    const resetUrl = `${getAppUrl()}/reset-password?token=${token}`;
    await sendEmail({
      to: normalized,
      subject: "Reset your LeanOut password",
      html: emailShell(
        "Password reset",
        `<p style="color:#374151;font-size:15px;line-height:1.6;">Tap the button below to set a new password. This link expires in 1 hour.</p>
         <p style="margin-top:20px;"><a href="${resetUrl}" style="display:inline-block;background:#f97316;color:#fff;font-weight:700;padding:12px 24px;border-radius:12px;text-decoration:none;">Reset password</a></p>
         <p style="color:#9ca3af;font-size:12px;margin-top:16px;">If you didn't request this, ignore this email.</p>`
      ),
    });
  }

  return NextResponse.json({
    ok: true,
    message: "If an account exists, a reset link was sent.",
  });
}
