// Path: src/app/api/admin/hostels/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { listingApprovedEmail, listingSuspendedEmail } from "@/lib/email-templates/listing-status";
import { indexSingleHostel, removeHostelIndex } from "@/lib/typesense-sync";
import { createNotification } from "@/lib/notifications";
import { getSafeErrorSummary } from "@/lib/safe-error";
import { z } from "zod";
import { readBoundedJson } from "@/lib/bounded-json";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  hostelId: z.string().cuid(),
  action:   z.enum(["verify", "suspend", "activate"]),
  reason:   z.string().max(500).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const moderationLimit = await rateLimit(`admin-hostel-moderation:${session.user.id}`, {
    limit: 30,
    windowMs: 60_000,
  });
  if (!moderationLimit.ok) {
    return NextResponse.json(
      { error: "Too many listing moderation actions. Try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.max(1, Math.ceil((moderationLimit.resetAt - Date.now()) / 1000))) },
      },
    );
  }

  const body = await readBoundedJson(req, 2_048);
  if (!body.ok) {
    return NextResponse.json({ error: body.error }, { status: body.status });
  }
  const parsed = schema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { hostelId, action, reason } = parsed.data;

  const data: Record<string, unknown> =
    action === "verify"   ? { verified: true, status: "ACTIVE" } :
    action === "suspend"  ? { status: "SUSPENDED" } :
                            { status: "ACTIVE" };

  try {
    const hostel = await db.hostel.findUnique({
      where: { id: hostelId },
      select: {
        id:       true,
        status:   true,
        verified: true,
        name:     true,
        owner: {
          select: {
            id:    true,  // needed to address the in-app notification
            email: true,
            name:  true,
          },
        },
      },
    });

    if (!hostel) {
      return NextResponse.json({ error: "Hostel not found." }, { status: 404 });
    }

    const actionAllowed =
      (action === "verify" && hostel.status === "PENDING_REVIEW") ||
      (action === "suspend" && (hostel.status === "PENDING_REVIEW" || hostel.status === "ACTIVE")) ||
      (action === "activate" && hostel.status === "SUSPENDED");
    if (!actionAllowed) {
      return NextResponse.json(
        { error: "This listing has already changed. Refresh the moderation queue and try again." },
        { status: 409 },
      );
    }

    const result = await db.hostel.updateMany({
      where: { id: hostelId, status: hostel.status },
      data,
    });
    if (result.count !== 1) {
      return NextResponse.json(
        { error: "This listing has already changed. Refresh the moderation queue and try again." },
        { status: 409 },
      );
    }

    // -- Typesense sync --
    if (action === "verify" || action === "activate") {
      void indexSingleHostel(hostel.id).catch((err) =>
        console.error("[typesense] Failed to index hostel:", getSafeErrorSummary(err)),
      );
    } else if (action === "suspend") {
      void removeHostelIndex(hostel.id).catch((err) =>
        console.error("[typesense] Failed to remove hostel from index:", getSafeErrorSummary(err)),
      );
    }

    // -- Email + in-app notification --
    // Both are fire-and-forget. A failure in either must never block the
    // admin action — the DB is already updated at this point.
    if (action === "verify" || action === "activate") {
      void sendEmail(
        listingApprovedEmail({
          ownerEmail: hostel.owner.email,
          ownerName:  hostel.owner.name,
          hostelName: hostel.name,
          hostelId:   hostel.id,
          status:     "APPROVED",
        }),
      ).catch((err) =>
        console.error("[email] Listing approval email dispatch failed:", getSafeErrorSummary(err)),
      );

      void createNotification({
        userId:   hostel.owner.id,
        type:     "HOSTEL_APPROVED",
        title:    "Listing approved 🎉",
        message:  `Your hostel "${hostel.name}" is now live and visible to students.`,
        hostelId: hostel.id,
      }).catch((err) =>
        console.error("[notifications] Listing approval notification failed:", getSafeErrorSummary(err)),
      );
    } else if (action === "suspend") {
      void sendEmail(
        listingSuspendedEmail({
          ownerEmail: hostel.owner.email,
          ownerName:  hostel.owner.name,
          hostelName: hostel.name,
          hostelId:   hostel.id,
          status:     "SUSPENDED",
          reason:     reason,
        }),
      ).catch((err) =>
        console.error("[email] Listing suspension email dispatch failed:", getSafeErrorSummary(err)),
      );

      void createNotification({
        userId:   hostel.owner.id,
        type:     "HOSTEL_REJECTED",
        title:    "Listing suspended",
        message:  `Your hostel "${hostel.name}" has been suspended. Check your email for details and next steps.`,
        hostelId: hostel.id,
      }).catch((err) =>
        console.error("[notifications] Listing suspension notification failed:", getSafeErrorSummary(err)),
      );
    }

    return NextResponse.json({
      data: {
        id:       hostel.id,
        status:   data.status,
        verified: action === "verify" ? true : hostel.verified,
      },
    });
  } catch (err) {
    console.error("[PATCH /api/admin/hostels]", getSafeErrorSummary(err));
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
