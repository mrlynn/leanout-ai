import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    await connectDB();

    await User.findByIdAndUpdate(session.user.id, {
      ...data,
      onboardingComplete: true,
    });

    return NextResponse.json({ message: "Onboarding complete" });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
