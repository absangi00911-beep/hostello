import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import {
  MAX_VERIFICATION_FILE_BYTES,
  hasVerificationFileSignature,
  isVerificationContentType,
  storeVerificationUpload,
} from "@/lib/verification-storage";
import { getSafeErrorSummary } from "@/lib/safe-error";
import { readBoundedFormData } from "@/lib/bounded-json";

const MAX_REQUEST_BYTES = Math.floor(4.4 * 1000 * 1000);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to submit student verification." }, { status: 401 });
  }
  if (session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Student accounts only." }, { status: 403 });
  }

  const limit = await rateLimit(`student-verification-upload:${session.user.id}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.ok) {
    return NextResponse.json({ error: "Upload limit reached. Try again later." }, { status: 429 });
  }

  const boundedForm = await readBoundedFormData(req, MAX_REQUEST_BYTES);
  if (!boundedForm.ok) {
    return NextResponse.json({ error: boundedForm.error }, { status: boundedForm.status });
  }
  const file = boundedForm.data.get("file");
  if (!isUploadedFile(file)) {
    return NextResponse.json({ error: "Choose a JPEG, PNG, WebP, or PDF document." }, { status: 400 });
  }
  if (!isVerificationContentType(file.type)) {
    return NextResponse.json({ error: "Upload a JPEG, PNG, WebP, or PDF document." }, { status: 400 });
  }
  if (file.size <= 0 || file.size > MAX_VERIFICATION_FILE_BYTES) {
    return NextResponse.json({ error: "File too large. Maximum size is 4MB." }, { status: 413 });
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { verificationStatus: true },
    });
    if (!user || user.verificationStatus === "APPROVED" || user.verificationStatus === "PENDING") {
      return NextResponse.json({ error: "Your verification request cannot accept another document." }, { status: 409 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!hasVerificationFileSignature(file.type, bytes)) {
      return NextResponse.json({ error: "File content does not match its declared type." }, { status: 400 });
    }
    const key = await storeVerificationUpload(session.user.id, file.type, bytes);
    return NextResponse.json({ key }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/user/verify-student/upload]", getSafeErrorSummary(error));
    return NextResponse.json({ error: "Private document upload is unavailable." }, { status: 503 });
  }
}

function isUploadedFile(value: FormDataEntryValue | null | undefined): value is File {
  return typeof value === "object" && value !== null &&
    "arrayBuffer" in value && typeof value.arrayBuffer === "function" &&
    "size" in value && typeof value.size === "number" &&
    "type" in value && typeof value.type === "string";
}
