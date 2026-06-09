import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import ProgressPhoto from "@/models/ProgressPhoto";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const photos = await ProgressPhoto.find({ userId: session.user.id })
    .sort({ date: -1 })
    .select("date notes weightLbs createdAt")
    .lean();

  return NextResponse.json({ photos });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date, imageData, notes, weightLbs } = await req.json();
  if (!date || !imageData) {
    return NextResponse.json({ error: "date and imageData required" }, { status: 400 });
  }
  if (typeof imageData !== "string" || imageData.length > 600_000) {
    return NextResponse.json({ error: "Image too large" }, { status: 400 });
  }

  await connectDB();
  const photo = await ProgressPhoto.create({
    userId: session.user.id,
    date,
    imageData,
    notes,
    weightLbs,
  });

  return NextResponse.json({ photo: { _id: photo._id, date: photo.date, notes: photo.notes, weightLbs: photo.weightLbs, createdAt: photo.createdAt } });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await connectDB();
  await ProgressPhoto.deleteOne({ _id: id, userId: session.user.id });
  return NextResponse.json({ ok: true });
}
