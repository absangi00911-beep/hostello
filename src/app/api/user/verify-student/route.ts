import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import {
  deleteVerificationDocument,
  isVerificationObjectKey,
  isVerificationUploadKey,
  promoteVerificationUpload,
  verifyUploadedDocument,
} from "@/lib/verification-storage";
import { getSafeErrorSummary } from "@/lib/safe-error";
import { readBoundedJson } from "@/lib/bounded-json";

/**
 * POST — student submits the key of a document uploaded to private R2 storage.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to submit student verification." }, { status: 401 });
  }
  if (session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Student accounts only." }, { status: 403 });
  }

  const limit = await rateLimit(`student-verification-submit:${session.user.id}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many verification attempts. Try again later." }, { status: 429 });
  }

  const body = await readBoundedJson(req, 1_024);
  if (!body.ok) {
    return NextResponse.json({ error: body.error }, { status: body.status });
  }
  const docKey = body.data && typeof body.data === "object" && !Array.isArray(body.data)
    ? (body.data as Record<string, unknown>).docKey
    : undefined;
  if (typeof docKey !== "string" || !isVerificationUploadKey(docKey, session.user.id)) {
    return NextResponse.json({ error: "A private verification document is required." }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { verificationStatus: true, verificationDocUrl: true },
  });
  if (!user || (user.verificationStatus !== "NONE" && user.verificationStatus !== "REJECTED")) {
    return NextResponse.json({ error: "Your verification request cannot accept another document." }, { status: 409 });
  }

  let reviewObjectKey: string;
  try {
    const verified = await verifyUploadedDocument(docKey);
    reviewObjectKey = await promoteVerificationUpload(docKey, session.user.id, verified.contentType);
  } catch (error) {
    console.error("[POST /api/user/verify-student] Uploaded document rejected:", getSafeErrorSummary(error));
    return NextResponse.json({ error: "The uploaded file is invalid or unavailable. Please upload it again." }, { status: 400 });
  }

  let updated: { count: number };
  try {
    updated = await db.user.updateMany({
      where: { id: session.user.id, verificationStatus: user.verificationStatus },
      data: {
        verificationDocUrl: reviewObjectKey,
        verificationStatus: "PENDING",
        verificationSubmittedAt: new Date(),
      },
    });
  } catch (error) {
    await deleteVerificationDocument(reviewObjectKey).catch(() => undefined);
    console.error("[POST /api/user/verify-student] Could not save submission:", getSafeErrorSummary(error));
    return NextResponse.json({ error: "Your document could not be submitted. Please try again." }, { status: 500 });
  }
  if (updated.count !== 1) {
    const latest = await db.user.findUnique({
      where: { id: session.user.id },
      select: { verificationDocUrl: true },
    });
    if (latest?.verificationDocUrl !== reviewObjectKey) {
      await deleteVerificationDocument(reviewObjectKey).catch(() => undefined);
    }
    return NextResponse.json({ error: "Your verification request changed. Refresh and try again." }, { status: 409 });
  }

  if (user.verificationDocUrl && isVerificationObjectKey(user.verificationDocUrl, session.user.id)) {
    await deleteVerificationDocument(user.verificationDocUrl).catch((error) => {
      console.error("[POST /api/user/verify-student] Previous private document cleanup failed:", getSafeErrorSummary(error));
    });
  }

  return NextResponse.json({ ok: true });
}
