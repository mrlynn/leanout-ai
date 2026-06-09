import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Guide from "@/models/Guide";

function isAdmin(email?: string | null) {
  return email && email === process.env.ADMIN_EMAIL;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const { slug } = await params;
  const admin = isAdmin(session.user.email);
  const filter = admin ? { slug } : { slug, published: true };
  const guide = await Guide.findOne(filter).lean();
  if (!guide) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(guide);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const { slug } = await params;
  const body = await req.json();
  const { title, summary, content, emoji, category, tags, published } = body;

  const guide = await Guide.findOneAndUpdate(
    { slug },
    { $set: { title, summary, content, emoji, category, tags, published } },
    { new: true, runValidators: true }
  );

  if (!guide) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(guide);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const { slug } = await params;
  await Guide.deleteOne({ slug });
  return NextResponse.json({ ok: true });
}
