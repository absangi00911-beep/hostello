import { getSafeErrorSummary } from "@/lib/safe-error";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { readBoundedJson } from "@/lib/bounded-json";
import { parsePagination } from "@/lib/pagination";
import { createNotification } from "@/lib/notifications";
import { rateLimit } from "@/lib/rate-limit";
import { enforceAdminReadLimit } from "@/lib/admin-read-limit";
import {
  deleteVerificationDocument,
  isVerificationObjectKey,
  verificationContentTypeForKey,
} from "@/lib/verification-storage";

const VALID_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
const MAX_UPDATE_BODY_BYTES = 2_048;

const updateSchema = z.object({
  userId: z.string().min(1).max(128),
  action: z.enum(["approve", "reject"]),
  reason: z.string().max(500).optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const readLimitResponse = await enforceAdminReadLimit(session.user.id);
  if (readLimitResponse) return readLimitResponse;

  if (req.nextUrl.search.length > 1_024) {
    return NextResponse.json({ error: "Query is too long." }, { status: 400 });
  }

  const status = (req.nextUrl.searchParams.get("status") ?? "PENDING") as (typeof VALID_STATUSES)[number];
  if (!(VALID_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const search = (req.nextUrl.searchParams.get("search") ?? "").trim();
  if (search.length > 100) {
    return NextResponse.json({ error: "Search is too long." }, { status: 400 });
  }

  const { page, limit, skip } = parsePagination(req.nextUrl.searchParams, {
    defaultLimit: 25,
    maxLimit: 50,
  });
  const where = {
    role: "STUDENT" as const,
    verificationStatus: status,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([db.user.findMany({
    where,
    orderBy: { verificationSubmittedAt: "asc" },
    skip,
    take: limit,
    select: {
      id: true,
      name: true,
      email: true,
      city: true,
      verificationDocUrl: true,
      verificationSubmittedAt: true,
      _count: {
        select: { bookings: true },
      },
    },
  }), db.user.count({ where })]);

  const data = users.map((user) => {
    const objectKey = typeof user.verificationDocUrl === "string" &&
      isVerificationObjectKey(user.verificationDocUrl, user.id)
      ? user.verificationDocUrl
      : null;
    const legacyPublicUrl = isLegacyPublicDocument(user.verificationDocUrl);
    const documentAvailable = Boolean(objectKey || legacyPublicUrl);

    return {
      ...user,
      verificationDocUrl: documentAvailable
        ? `/api/admin/verifications/${encodeURIComponent(user.id)}/document`
        : null,
      verificationDocContentType: objectKey
        ? verificationContentTypeForKey(objectKey)
        : legacyPublicUrl
          ? legacyContentType(user.verificationDocUrl!)
          : null,
    };
  });

  return NextResponse.json({
    data,
    total,
    page,
    limit,
    hasMore: skip + data.length < total,
  });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const actionLimit = await rateLimit(`admin-verification-write:${session.user.id}`, {
    limit: 30,
    windowMs: 60_000,
  });
  if (!actionLimit.ok) {
    return NextResponse.json(
      { error: "Too many verification decisions. Try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.max(1, Math.ceil((actionLimit.resetAt - Date.now()) / 1000))) },
      },
    );
  }

  const body = await readBoundedJson(req, MAX_UPDATE_BODY_BYTES);
  if (!body.ok) {
    return NextResponse.json({ error: body.error }, { status: body.status });
  }

  const parsed = updateSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { userId, action } = parsed.data;

  const existing = await db.user.findUnique({
    where: { id: userId, role: "STUDENT", verificationStatus: "PENDING" },
    select: { verificationDocUrl: true },
  });

  const updateData: {
    verificationStatus: "APPROVED" | "REJECTED";
    studentVerified: boolean;
    verificationDocUrl?: string | null;
    verifiedById: string;
    verificationDecidedAt: Date;
  } =
    action === "approve"
      ? {
          verificationStatus: "APPROVED",
          studentVerified: true,
          verificationDocUrl: null,
          verifiedById: session.user.id,
          verificationDecidedAt: new Date(),
        }
      : {
          verificationStatus: "REJECTED",
          studentVerified: false,
          verificationDocUrl: null,
          verifiedById: session.user.id,
          verificationDecidedAt: new Date(),
        };

  try {
    const decision = await db.user.updateMany({
      where: { id: userId, role: "STUDENT", verificationStatus: "PENDING" },
      data: updateData,
    });

    if (decision.count !== 1) {
      return NextResponse.json(
        { error: "This verification request has already changed. Refresh the queue and try again." },
        { status: 409 },
      );
    }

    if (existing?.verificationDocUrl && isVerificationObjectKey(existing.verificationDocUrl, userId)) {
      await deleteVerificationDocument(existing.verificationDocUrl).catch((error) => {
        console.error("[PUT /api/admin/verifications] Private document cleanup failed:", getSafeErrorSummary(error));
      });
    }

    void createNotification({
      userId,
      type: action === "approve" ? "STUDENT_VERIFICATION_APPROVED" : "STUDENT_VERIFICATION_REJECTED",
      title: action === "approve" ? "Student verification approved" : "Student verification rejected",
      message:
        action === "approve"
          ? "Your student verification has been approved."
          : "Your student verification was not approved. Please review the feedback and resubmit the correct document.",
    }).catch(() => undefined);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[PUT /api/admin/verifications]", getSafeErrorSummary(error));
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

function isLegacyPublicDocument(value: string | null | undefined): boolean {
  if (!value || !process.env.R2_PUBLIC_URL) return false;
  try {
    const candidate = new URL(value);
    const publicOrigin = new URL(process.env.R2_PUBLIC_URL).origin;
    return candidate.origin === publicOrigin && /^\/hostels\/[A-Za-z0-9._-]+$/.test(candidate.pathname);
  } catch {
    return false;
  }
}

function legacyContentType(value: string): string | null {
  if (/\.jpe?g$/i.test(value)) return "image/jpeg";
  if (/\.png$/i.test(value)) return "image/png";
  if (/\.webp$/i.test(value)) return "image/webp";
  return null;
}
