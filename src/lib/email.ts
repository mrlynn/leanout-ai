import { Resend } from "resend";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const FROM = process.env.RESEND_FROM ?? "LeanOut AI <onboarding@resend.dev>";

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.log(`[email] skipped (no RESEND_API_KEY): ${opts.subject} → ${opts.to}`);
    return false;
  }
  const { error } = await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
  if (error) {
    console.error("[email] send failed:", error);
    return false;
  }
  return true;
}

export function emailShell(title: string, body: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#faf8f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="background:linear-gradient(135deg,#f97316,#ea580c);border-radius:16px;padding:24px;margin-bottom:24px;">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;">LeanOut AI</h1>
      <p style="margin:8px 0 0;color:#fed7aa;font-size:14px;">${title}</p>
    </div>
    <div style="background:#fff;border-radius:16px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
      ${body}
    </div>
    <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:24px;">
      <a href="${process.env.NEXTAUTH_URL ?? ""}/settings" style="color:#f97316;">Manage preferences</a>
    </p>
  </div>
</body>
</html>`;
}
