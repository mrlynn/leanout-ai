import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token, platform } = await req.json();
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }

  await connectDB();
  await User.findByIdAndUpdate(session.user.id, {
    $addToSet: { pushTokens: `${platform ?? "native"}:${token}` },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });

  await connectDB();
  const user = await User.findById(session.user.id);
  if (user) {
    user.pushTokens = (user.pushTokens ?? []).filter((t: string) => !t.includes(token));
    await user.save();
  }

  return NextResponse.json({ ok: true });
}
