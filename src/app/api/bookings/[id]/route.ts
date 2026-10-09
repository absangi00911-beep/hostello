import { getSafeErrorSummary } from "@/lib/safe-error";
// Path: src/app/api/bookings/[id]/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { readBoundedJson } from "@/lib/bounded-json";
import { sendEmail } from "@/lib/email";
import { bookingStatusEmail } from "@/lib/email-templates/booking-status";
import { createNotification } from "@/lib/notifications";
import { rateLimit } from "@/lib/rate-limit";
import { processRefund } from "@/lib/refunds";
import { CANCELLATION_POLICY_DETAILS, getCancellationRefundAmount } from "@/lib/cancellation-policy";
import {
  createOperationalLogContext,
  hashOperationalIdentifier,
  logOperationalEvent,
} from "@/lib/operational-logger";

const MAX_BOOKING_ID_LENGTH = 64;
const BOOKING_DETAIL_READS_PER_MINUTE = 120;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    if (id.length > MAX_BOOKING_ID_LENGTH) {
      return NextResponse.json({ error: "Invalid booking ID." }, { status: 400 });
    }

    const readLimit = await rateLimit(`booking-detail:${session.user.id}`, {
      limit: BOOKING_DETAIL_READS_PER_MINUTE,
      windowMs: 60 * 1000,
    });
    if (!readLimit.ok) {
      return NextResponse.json(
        { error: "Too many booking requests. Please slow down." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.max(1, Math.ceil((readLimit.resetAt - Date.now()) / 1000))) },
        },
      );
    }

    const isAdmin = session.user.role === "ADMIN";
    const booking = await db.booking.findFirst({
      where: isAdmin
        ? { id }
        : { id, OR: [{ userId: session.user.id }, { hostel: { is: { ownerId: session.user.id } } }] },
      include: {
        hostel: {
          select: {
            id: true, name: true, slug: true,
            coverImage: true, city: true, area: true, address: true,
            ownerId: true,
            owner: { select: { name: true, phone: true } },
          },
        },
        user: {
          select: { id: true, name: true, email: true, phone: true, avatar: true },
        },
      },
    });

    if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

    const isStudent = booking.userId === session.user.id;
    const isOwner   = booking.hostel.ownerId === session.user.id;

    if (!isStudent && !isOwner && !isAdmin) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    return NextResponse.json({ data: booking, viewAs: isOwner && !isStudent ? "owner" : "student" });
  } catch (err) {
    console.error("[GET /api/bookings/[id]]", getSafeErrorSummary(err));
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const actionLimit = await rateLimit(`booking-action:${session.user.id}`, {
      limit: 30,
      windowMs: 60 * 1000,
    });
    if (!actionLimit.ok) {
      return NextResponse.json({ error: "Too many booking actions. Please slow down." }, { status: 429 });
    }

    const { id } = await params;
    if (id.length > MAX_BOOKING_ID_LENGTH) {
      return NextResponse.json({ error: "Invalid booking ID." }, { status: 400 });
    }

    const body = await readBoundedJson(req, 1_024);
    if (!body.ok) {
      return NextResponse.json({ error: body.error }, { status: body.status });
    }
    if (!body.data || typeof body.data !== "object" || Array.isArray(body.data)) {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }
    const action = (body.data as Record<string, unknown>).action;

    if (typeof action !== "string" || !["cancel", "confirm", "decline"].includes(action)) {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    const isAdmin = session.user.role === "ADMIN";
    const booking = await db.booking.findFirst({
      where: isAdmin
        ? { id }
        : { id, OR: [{ userId: session.user.id }, { hostel: { is: { ownerId: session.user.id } } }] },
      include: {
        hostel: { select: { ownerId: true, name: true, slug: true } },
        user:   { select: { name: true, email: true } },
      },
    });

    if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

    const isStudent     = booking.userId === session.user.id;
    const isHostelOwner = booking.hostel.ownerId === session.user.id;

    // Log admin actions for audit trail
    if (isAdmin && !isStudent && !isHostelOwner) {
      const actorIdHash = hashOperationalIdentifier(`admin:${session.user.id}`);
      const bookingIdHash = hashOperationalIdentifier(`booking:${id}`);
      logOperationalEvent(
        "info",
        "booking.admin_action",
        {
          action,
          actor_role: "ADMIN",
          ...(actorIdHash ? { actor_id_hash: actorIdHash } : {}),
          ...(bookingIdHash ? { booking_id_hash: bookingIdHash } : {}),
        },
        createOperationalLogContext(req),
      );
    }

    // -- Cancel (student or admin only) ----------------------------------------
    if (action === "cancel") {
      if (!isStudent && !isAdmin) {
        if (!isHostelOwner) {
          return NextResponse.json({ error: "Booking not found." }, { status: 404 });
        }
        return NextResponse.json({ error: "Only the student can cancel." }, { status: 403 });
      }
      if (["CANCELLED", "COMPLETED"].includes(booking.status)) {
        return NextResponse.json({ error: "Booking cannot be cancelled." }, { status: 400 });
      }
      if (isStudent && !["PENDING", "CONFIRMED"].includes(booking.status)) {
        return NextResponse.json({ error: "This booking cannot be cancelled online." }, { status: 400 });
      }
      if (isStudent && booking.checkOut <= new Date()) {
        return NextResponse.json({ error: "A stay cannot be cancelled after check-out." }, { status: 400 });
      }
      if (isStudent && booking.status === "CONFIRMED" && !booking.cancellationPolicy) {
        return NextResponse.json(
          { error: "This booking has no saved cancellation terms. Contact support for help." },
          { status: 409 },
        );
      }
      if (booking.payoutId) {
        return NextResponse.json(
          { error: "This booking is already in a payout batch. Contact support for help." },
          { status: 409 },
        );
      }

      const cancelledAt = new Date();
      const refundAmount = booking.paymentStatus !== "PAID"
        ? 0
        : isStudent && booking.status === "CONFIRMED" && booking.cancellationPolicy
          ? getCancellationRefundAmount(booking.cancellationPolicy, booking.total, booking.checkIn, cancelledAt)
          : booking.total;

      // Use a transaction to atomically cancel the booking and restore room availability.
      const updated = await db.$transaction(async (tx) => {
        const cancelled = await tx.booking.updateMany({
          where: {
            id,
            status: booking.status,
            payoutId: null,
            paymentStatus: booking.paymentStatus,
            ...(isStudent ? { userId: session.user.id } : {}),
          },
          data: {
            status: "CANCELLED",
            cancellationRefundAmount: refundAmount,
          },
        });

        if (cancelled.count !== 1) return null;

        // Restore room availability if a specific room was booked
        if (booking.roomId && booking.checkIn > cancelledAt) {
          await tx.room.update({
            where: { id: booking.roomId },
            data: {
              available: { increment: booking.guests },
              version: { increment: 1 },
            },
          });
        }

        return { id, status: "CANCELLED" as const, roomId: booking.roomId, cancellationRefundAmount: refundAmount };
      });

      if (!updated) {
        const current = await db.booking.findUnique({
          where: { id },
          select: { payoutId: true },
        });
        if (current?.payoutId) {
          return NextResponse.json(
            { error: "This booking entered a payout batch and cannot be cancelled online. Contact support for help." },
            { status: 409 },
          );
        }
        return NextResponse.json(
          { error: "Booking changed before the action completed. Refresh and try again." },
          { status: 409 },
        );
      }

      // Notify owner that student cancelled
      void createNotification({
        userId: booking.hostel.ownerId,
        type: "BOOKING_CANCELLED",
        title: "Booking Cancelled",
        message: `${booking.user.name} has cancelled their booking for ${booking.hostel.name}.`,
        bookingId: id,
        hostelId: booking.hostelId,
      });

      if (booking.paymentStatus === "PAID" && refundAmount > 0) {
        try {
          const refund = await processRefund(id, isStudent && booking.status === "CONFIRMED"
            ? "system:student-cancelled-confirmed-booking"
            : "system:student-cancelled-pending-booking");
          return NextResponse.json({
            data: { ...updated, paymentStatus: refund.booking.paymentStatus, refundState: refund.booking.refundState },
            message: refund.automatic
              ? `Booking cancelled and PKR ${refundAmount.toLocaleString("en-PK")} refund processed. Banks may take 3–10 business days to post it.`
              : "Booking cancelled. The refund is being reconciled; check the booking page for updates.",
          });
        } catch (err) {
          const summary = getSafeErrorSummary(err);
          logOperationalEvent("error", "payment.reconciliation_required", {
            entity_type: "booking",
            entity_id: hashOperationalIdentifier(`booking:${id}`),
            reason: "student_cancel_refund_failed",
            error_name: summary.name,
            ...(summary.code ? { error_code: summary.code } : {}),
          }, createOperationalLogContext(req));
          return NextResponse.json({
            data: { ...updated, paymentStatus: "PAID", refundState: "UNCERTAIN" },
            message: "Booking cancelled. The refund needs manual review; contact support if the booking page does not update.",
          });
        }
      }

      const noRefundMessage = isStudent && booking.status === "CONFIRMED" && booking.cancellationPolicy
        ? `Booking cancelled. The ${CANCELLATION_POLICY_DETAILS[booking.cancellationPolicy].label} policy provides no refund at this time.`
        : "Booking cancelled.";
      return NextResponse.json({ data: updated, message: noRefundMessage });
    }

    // -- Confirm / Decline (hostel owner or admin only) -------------------------
    if (!isHostelOwner && !isAdmin) {
      if (!isStudent) {
        return NextResponse.json({ error: "Booking not found." }, { status: 404 });
      }
      return NextResponse.json({ error: "Only the hostel owner can do this." }, { status: 403 });
    }
    if (booking.status !== "PENDING") {
      return NextResponse.json(
        { error: `Booking is already ${booking.status.toLowerCase()}.` },
        { status: 400 }
      );
    }

    if (action === "confirm" && booking.paymentStatus !== "PAID") {
      return NextResponse.json(
        { error: "This booking cannot be confirmed until its payment is received." },
        { status: 409 },
      );
    }

    const actionAt = new Date();
    const effectiveResponseDueAt = booking.ownerResponseDueAt ??
      new Date(booking.createdAt.getTime() + 24 * 60 * 60 * 1000);
    if (effectiveResponseDueAt <= actionAt) {
      return NextResponse.json(
        { error: "The 24-hour response window has ended. This booking is being cancelled and refunded." },
        { status: 409 },
      );
    }

    const newStatus = action === "confirm" ? "CONFIRMED" : "CANCELLED";

    // Use a transaction so decline also restores room availability atomically
    const updated = await db.$transaction(async (tx) => {
      const result = await tx.booking.updateMany({
        where: {
          id,
          status: "PENDING",
          paymentStatus: booking.paymentStatus,
          ...(booking.ownerResponseDueAt
            ? { ownerResponseDueAt: { gt: actionAt } }
            : {
                ownerResponseDueAt: null,
                createdAt: { gt: new Date(actionAt.getTime() - 24 * 60 * 60 * 1000) },
              }),
          ...(isHostelOwner ? { hostel: { is: { ownerId: session.user.id } } } : {}),
        },
          data: {
            status: newStatus,
            ...(newStatus === "CANCELLED" && booking.paymentStatus === "PAID"
              ? { cancellationRefundAmount: booking.total }
              : {}),
          },
      });

      if (result.count !== 1) return null;

      // Restore room availability when owner declines
      if (newStatus === "CANCELLED" && booking.roomId) {
        await tx.room.update({
          where: { id: booking.roomId },
          data: {
            available: { increment: booking.guests },
            version: { increment: 1 },
          },
        });
      }

      return { id, status: newStatus, roomId: booking.roomId };
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Booking changed before the action completed. Refresh and try again." },
        { status: 409 },
      );
    }

    let refundAutomatic: boolean | null = null;
    let refundNeedsReview = false;
    if (newStatus === "CANCELLED" && booking.paymentStatus === "PAID") {
      try {
        const refund = await processRefund(id, "system:owner-declined-booking");
        refundAutomatic = refund.automatic;
        refundNeedsReview = !refund.automatic;
      } catch (err) {
        refundNeedsReview = true;
        const summary = getSafeErrorSummary(err);
        logOperationalEvent("error", "payment.reconciliation_required", {
          entity_type: "booking",
          entity_id: hashOperationalIdentifier(`booking:${id}`),
          reason: "owner_decline_refund_failed",
          error_name: summary.name,
          ...(summary.code ? { error_code: summary.code } : {}),
        }, createOperationalLogContext(req));
      }
    }

    // A successful refund service sends the processed email itself. If the
    // provider outcome is uncertain, send a cancellation update without
    // claiming that the refund has completed.
    if (newStatus === "CONFIRMED" || !refundAutomatic) {
      void sendEmail(
        bookingStatusEmail({
          studentName:  booking.user.name,
          studentEmail: booking.user.email,
          hostelName:   booking.hostel.name,
          hostelSlug:   booking.hostel.slug,
          bookingId:    booking.id,
          status:       newStatus,
          refundPending: refundNeedsReview,
        })
      ).catch(() => {
        // A failed status email does not roll back the booking transition.
      });
    }

    // Notify student in-app
    const notificationType = newStatus === "CONFIRMED" ? "BOOKING_CONFIRMED" : "BOOKING_CANCELLED";
    const notificationTitle = newStatus === "CONFIRMED" ? "Booking Confirmed ✅" : "Booking Declined ❌";
    const notificationMessage = newStatus === "CONFIRMED"
      ? `Your booking for ${booking.hostel.name} has been confirmed!`
      : refundNeedsReview
        ? `Your booking for ${booking.hostel.name} was declined. The refund is being reconciled.`
        : booking.paymentStatus === "PAID"
          ? `Your booking for ${booking.hostel.name} was declined and your full refund was processed.`
          : `Your booking for ${booking.hostel.name} has been declined.`;

    void createNotification({
      userId: booking.userId,
      type: notificationType,
      title: notificationTitle,
      message: notificationMessage,
      bookingId: booking.id,
      hostelId: booking.hostelId,
    });

    return NextResponse.json({
      data: {
        ...updated,
        ...(newStatus === "CANCELLED" && booking.paymentStatus === "PAID"
          ? { paymentStatus: refundAutomatic ? "REFUNDED" : "PAID", refundState: refundAutomatic ? "REFUNDED" : "UNCERTAIN" }
          : {}),
      },
      message: action === "confirm"
        ? "Booking confirmed."
        : refundAutomatic
          ? "Booking declined and full refund processed."
          : refundNeedsReview
            ? "Booking declined. Refund needs reconciliation."
            : "Booking declined.",
    });
  } catch (err) {
    console.error("[PATCH /api/bookings/[id]]", getSafeErrorSummary(err));
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
