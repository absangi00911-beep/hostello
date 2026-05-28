import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

/**
 * POST — student submits their verification doc URL.
 * The file is already uploaded via /api/upload; this just records the URL
 * and sets status to PENDING for admin review.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { docUrl } = await req.json().catch(() => ({}));
  if (!docUrl || typeof docUrl !== "string") {
    return NextResponse.json({ error: "docUrl is required" }, { status: 400 });
  }

  // Prevent re-submission if already approved
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { verificationStatus: true },
  });

  if (user?.verificationStatus === "APPROVED") {
    return NextResponse.json({ error: "Already verified" }, { status: 409 });
  }

  await db.user.update({
    where: { id: session.user.id },
    data: {
      verificationDocUrl:      docUrl,
      verificationStatus:      "PENDING",
      verificationSubmittedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
