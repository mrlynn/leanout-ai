import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { getUserContext } from "@/lib/userContext";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const context = await getUserContext(session.user.id);
  if (!context) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(context);
}
