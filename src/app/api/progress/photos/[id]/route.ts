import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import ProgressPhoto from "@/models/ProgressPhoto";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();
  const photo = await ProgressPhoto.findOne({ _id: id, userId: session.user.id }).lean();
  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    photo: {
      _id: photo._id,
      date: photo.date,
      pose: photo.pose,
      weightLbs: photo.weightLbs,
      imageData: photo.imageData,
      blobUrl: photo.blobUrl,
    },
  });
}
