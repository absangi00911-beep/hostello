// Path: src/app/api/admin/hostels/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { listingApprovedEmail, listingSuspendedEmail } from "@/lib/email-templates/listing-status";
import { indexSingleHostel, removeHostelIndex } from "@/lib/typesense-sync";
import { createNotification } from "@/lib/notifications";
import { z } from "zod";

const schema = z.object({
  hostelId: z.string().cuid(),
  action:   z.enum(["verify", "suspend", "activate"]),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body   = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { hostelId, action } = parsed.data;

  const data: Record<string, unknown> =
    action === "verify"   ? { verified: true, status: "ACTIVE" } :
    action === "suspend"  ? { status: "SUSPENDED" } :
                            { status: "ACTIVE" };

  try {
    const hostel = await db.hostel.update({
      where: { id: hostelId },
      data,
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

    // ── Typesense sync ─────────────────────────────────────────────────────
    if (action === "verify" || action === "activate") {
      void indexSingleHostel(hostel.id).catch((err) =>
        console.error(`[typesense] Failed to index hostel ${hostel.id}:`, err),
      );
    } else if (action === "suspend") {
      void removeHostelIndex(hostel.id).catch((err) =>
        console.error(`[typesense] Failed to remove hostel ${hostel.id}:`, err),
      );
    }

    // ── Email + in-app notification ────────────────────────────────────────
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
      ).catch(() =>
        console.error(
          `[email] Failed to send listing approved email to ${hostel.owner.email} ` +
          `for hostel ${hostel.id}`,
        ),
      );

      void createNotification({
        userId:   hostel.owner.id,
        type:     "HOSTEL_APPROVED",
        title:    "Listing approved 🎉",
        message:  `Your hostel "${hostel.name}" is now live and visible to students.`,
        hostelId: hostel.id,
      }).catch((err) =>
        console.error(
          `[notifications] Failed to send HOSTEL_APPROVED notification ` +
          `to owner ${hostel.owner.id} for hostel ${hostel.id}:`,
          err,
        ),
      );
    } else if (action === "suspend") {
      void sendEmail(
        listingSuspendedEmail({
          ownerEmail: hostel.owner.email,
          ownerName:  hostel.owner.name,
          hostelName: hostel.name,
          hostelId:   hostel.id,
          status:     "SUSPENDED",
        }),
      ).catch(() =>
        console.error(
          `[email] Failed to send listing suspended email to ${hostel.owner.email} ` +
          `for hostel ${hostel.id}`,
        ),
      );

      void createNotification({
        userId:   hostel.owner.id,
        type:     "HOSTEL_REJECTED",
        title:    "Listing suspended",
        message:  `Your hostel "${hostel.name}" has been suspended. Check your email for details and next steps.`,
        hostelId: hostel.id,
      }).catch((err) =>
        console.error(
          `[notifications] Failed to send HOSTEL_REJECTED notification ` +
          `to owner ${hostel.owner.id} for hostel ${hostel.id}:`,
          err,
        ),
      );
    }

    return NextResponse.json({
      data: {
        id:       hostel.id,
        status:   hostel.status,
        verified: hostel.verified,
      },
    });
  } catch (err) {
    console.error("[PATCH /api/admin/hostels]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}