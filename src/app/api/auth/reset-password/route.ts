import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { hashPassword, hashResetToken } from "@/lib/passwordReset";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();
  if (!token || typeof token !== "string" || !password || typeof password !== "string") {
    return NextResponse.json({ error: "Token and password required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  await connectDB();
  const hash = hashResetToken(token);
  const user = await User.findOne({
    passwordResetHash: hash,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
  }

  user.password = await hashPassword(password);
  user.passwordResetHash = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return NextResponse.json({ ok: true });
}
