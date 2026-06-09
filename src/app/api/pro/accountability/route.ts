import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import AccountabilityShare from "@/models/AccountabilityShare";
import { requirePro } from "@/lib/planTier";
import { getAppUrl } from "@/lib/billing";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const proBlock = await requirePro(session.user.id);
  if (proBlock) return proBlock;

  await connectDB();
  const share = await AccountabilityShare.findOne({
    userId: session.user.id,
    revokedAt: null,
  }).lean();

  if (!share) return NextResponse.json({ share: null });
  return NextResponse.json({
    share: {
      partnerEmail: share.partnerEmail,
      notifyPartner: share.notifyPartner,
      expiresAt: share.expiresAt,
      createdAt: share.createdAt,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const proBlock = await requirePro(session.user.id);
  if (proBlock) return proBlock;

  const { action, partnerEmail, notifyPartner } = await req.json();
  await connectDB();

  if (action === "revoke") {
    await AccountabilityShare.updateMany(
      { userId: session.user.id, revokedAt: null },
      { revokedAt: new Date() }
    );
    return NextResponse.json({ ok: true });
  }

  if (action === "create") {
    await AccountabilityShare.updateMany(
      { userId: session.user.id, revokedAt: null },
      { revokedAt: new Date() }
    );

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    await AccountabilityShare.create({
      userId: session.user.id,
      tokenHash: hashToken(token),
      partnerEmail: partnerEmail || undefined,
      notifyPartner: !!notifyPartner && !!partnerEmail,
      expiresAt,
    });

    const url = `${getAppUrl()}/share/${token}`;
    return NextResponse.json({ url, expiresAt });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
