import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rate = await checkRateLimit(`register:ip:${ip}`, 5, 60 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json({ error: "Too many registration attempts. Try again later." }, { status: 429 });
    }

    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    await connectDB();

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "Unable to create account with these credentials" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    await User.create({ name, email, password: hashed });

    return NextResponse.json({ message: "Account created" }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
