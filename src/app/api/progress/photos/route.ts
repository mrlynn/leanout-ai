import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import ProgressPhoto from "@/models/ProgressPhoto";
import { uploadProgressPhoto, deleteProgressBlob } from "@/lib/progressPhotoStorage";

const POSES = ["front", "side", "back"] as const;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const photos = await ProgressPhoto.find({ userId: session.user.id })
    .sort({ date: -1 })
    .select("date pose notes weightLbs createdAt blobUrl")
    .lean();

  return NextResponse.json({ photos });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date, imageData, notes, weightLbs, pose } = await req.json();
  if (!date || !imageData) {
    return NextResponse.json({ error: "date and imageData required" }, { status: 400 });
  }
  if (typeof imageData !== "string" || imageData.length > 600_000) {
    return NextResponse.json({ error: "Image too large" }, { status: 400 });
  }
  const photoPose = POSES.includes(pose) ? pose : "front";

  await connectDB();
  const blobUrl = await uploadProgressPhoto(session.user.id, date, photoPose, imageData);

  const photo = await ProgressPhoto.findOneAndUpdate(
    { userId: session.user.id, date, pose: photoPose },
    {
      userId: session.user.id,
      date,
      pose: photoPose,
      imageData: blobUrl ? undefined : imageData,
      blobUrl: blobUrl ?? undefined,
      notes,
      weightLbs,
    },
    { upsert: true, new: true }
  );

  return NextResponse.json({
    photo: {
      _id: photo._id,
      date: photo.date,
      pose: photo.pose,
      notes: photo.notes,
      weightLbs: photo.weightLbs,
      createdAt: photo.createdAt,
    },
  });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await connectDB();
  const photo = await ProgressPhoto.findOne({ _id: id, userId: session.user.id });
  if (photo?.blobUrl) await deleteProgressBlob(photo.blobUrl);
  await ProgressPhoto.deleteOne({ _id: id, userId: session.user.id });
  return NextResponse.json({ ok: true });
}
