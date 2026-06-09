import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Guide from "@/models/Guide";

function isAdmin(email?: string | null) {
  return email && email === process.env.ADMIN_EMAIL;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export async function GET(req: NextRequest) {
  await connectDB();
  const session = await auth();
  const admin = isAdmin(session?.user?.email);
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "true" && admin;

  const filter = all ? {} : { published: true };
  const guides = await Guide.find(filter)
    .select("title slug summary emoji category published createdAt tags")
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json(guides);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const body = await req.json();
  const { title, summary, content, emoji, category, tags, published } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  let slug = slugify(title);
  // ensure uniqueness
  const existing = await Guide.findOne({ slug }).lean();
  if (existing) slug = `${slug}-${Date.now()}`;

  const guide = await Guide.create({
    title: title.trim(),
    slug,
    summary: summary ?? "",
    content: content ?? "",
    emoji: emoji ?? "📖",
    category: category ?? "General",
    tags: Array.isArray(tags) ? tags : [],
    published: published ?? false,
    authorEmail: session!.user!.email!,
  });

  return NextResponse.json(guide, { status: 201 });
}
