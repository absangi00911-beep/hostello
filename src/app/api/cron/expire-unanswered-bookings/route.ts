import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processRefund } from "@/lib/refunds";
import { sendEmail } from "@/lib/email";
import { bookingOwnerReminderEmail } from "@/lib/email-templates/booking";
import { bookingStatusEmail } from "@/lib/email-templates/booking-status";
import { createNotification } from "@/lib/notifications";
import { createOperationalLogContext, hashOperationalIdentifier, logOperationalEvent } from "@/lib/operational-logger";
import { runCronJob } from "@/lib/cron-utils";
import { verifyUpstashRequest } from "@/lib/verify-upstash";
import { getSafeErrorSummary } from "@/lib/safe-error";

export const maxDuration = 60;
const REMINDER_WINDOW_MS = 6 * 60 * 60 * 1000;
const OWNER_RESPONSE_WINDOW_MS = 24 * 60 * 60 * 1000;
const BATCH_SIZE = 5;
const MAX_EXPIRATIONS_PER_RUN = 20;

export async function POST(req: NextRequest) {
  try {
    await verifyUpstashRequest(req, { acceptBearerToken: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logContext = createOperationalLogContext(req);
  return runCronJob("expire-unanswered-bookings", async (cronContext) => {
    const now = new Date();
    const reminderBefore = new Date(now.getTime() + REMINDER_WINDOW_MS);
    let remindersSent = 0;
    let expired = 0;
    let refundsStarted = 0;
    let refundsNeedingReview = 0;

    // Backfill deadlines for paid requests created before deadline tracking
    // was introduced, so they still expire and receive the full-refund path.
    const legacyDeadlineCandidates = await db.booking.findMany({
      where: {
        status: "PENDING",
        paymentStatus: "PAID",
        ownerResponseDueAt: null,
        createdAt: { lte: new Date(reminderBefore.getTime() - OWNER_RESPONSE_WINDOW_MS) },
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: 100,
      select: { id: true, createdAt: true },
    });
    for (const candidate of legacyDeadlineCandidates) {
      await db.booking.updateMany({
        where: {
          id: candidate.id,
          status: "PENDING",
          paymentStatus: "PAID",
          ownerResponseDueAt: null,
        },
        data: { ownerResponseDueAt: new Date(candidate.createdAt.getTime() + OWNER_RESPONSE_WINDOW_MS) },
      });
    }

    const reminderCandidates = await db.booking.findMany({
      where: {
        status: "PENDING",
        paymentStatus: "PAID",
        ownerResponseDueAt: { gt: now, lte: reminderBefore },
        ownerResponseReminderSentAt: null,
      },
      orderBy: [{ ownerResponseDueAt: "asc" }, { id: "asc" }],
      take: 100,
      select: { id: true, ownerResponseDueAt: true },
    });

    for (const candidate of reminderCandidates) {
      const claimedAt = new Date();
      const claim = await db.booking.updateMany({
        where: {
          id: candidate.id,
          status: "PENDING",
          paymentStatus: "PAID",
          ownerResponseDueAt: { gt: claimedAt, lte: reminderBefore },
          ownerResponseReminderSentAt: null,
        },
        data: { ownerResponseReminderSentAt: claimedAt },
      });
      if (claim.count !== 1) continue;

      const booking = await db.booking.findUnique({
        where: { id: candidate.id },
        include: {
          user: { select: { name: true, email: true } },
          hostel: {
            select: {
              name: true,
              slug: true,
              owner: { select: { name: true, email: true } },
            },
          },
        },
      });
      if (!booking?.ownerResponseDueAt) continue;

      try {
        const delivery = await sendEmail(bookingOwnerReminderEmail({
          studentName: booking.user.name,
          studentEmail: booking.user.email,
          ownerName: booking.hostel.owner.name,
          ownerEmail: booking.hostel.owner.email,
          hostelName: booking.hostel.name,
          hostelSlug: booking.hostel.slug,
          bookingId: booking.id,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          months: booking.months,
          total: booking.total,
          paymentMethod: booking.paymentMethod ?? "Payment gateway",
          responseDueAt: booking.ownerResponseDueAt,
        }));
        if (delivery.success) {
          remindersSent += 1;
        } else {
          await db.booking.updateMany({
            where: { id: booking.id, ownerResponseReminderSentAt: claimedAt },
            data: { ownerResponseReminderSentAt: null },
          });
          logOperationalEvent("error", "notification.dispatch_failed", {
            notification_type: "BOOKING_OWNER_RESPONSE_REMINDER",
            booking_id: hashOperationalIdentifier(`booking:${booking.id}`),
            reason: "provider_rejected",
          }, cronContext);
        }
      } catch (err) {
        await db.booking.updateMany({
          where: { id: booking.id, ownerResponseReminderSentAt: claimedAt },
          data: { ownerResponseReminderSentAt: null },
        });
        const summary = getSafeErrorSummary(err);
        logOperationalEvent("error", "notification.dispatch_failed", {
          notification_type: "BOOKING_OWNER_RESPONSE_REMINDER",
          booking_id: hashOperationalIdentifier(`booking:${booking.id}`),
          error_name: summary.name,
          ...(summary.code ? { error_code: summary.code } : {}),
        }, cronContext);
      }
    }

    while (expired < MAX_EXPIRATIONS_PER_RUN) {
      const expiredCandidates = await db.booking.findMany({
        where: {
          status: "PENDING",
          paymentStatus: "PAID",
          ownerResponseDueAt: { lte: new Date() },
        },
        orderBy: [{ ownerResponseDueAt: "asc" }, { id: "asc" }],
        take: Math.min(BATCH_SIZE, MAX_EXPIRATIONS_PER_RUN - expired),
        select: { id: true, hostelId: true, roomId: true, total: true, guests: true },
      });
      if (expiredCandidates.length === 0) break;

      const cancelled = await db.$transaction(async (tx) => {
        const claimed: typeof expiredCandidates = [];
        for (const candidate of expiredCandidates) {
          const transition = await tx.booking.updateMany({
            where: {
              id: candidate.id,
              status: "PENDING",
              paymentStatus: "PAID",
              ownerResponseDueAt: { lte: new Date() },
              payoutId: null,
            },
              data: { status: "CANCELLED", cancellationRefundAmount: candidate.total },
          });
          if (transition.count !== 1) continue;
          if (candidate.roomId) {
            await tx.room.updateMany({
              where: { id: candidate.roomId },
              data: { available: { increment: candidate.guests }, version: { increment: 1 } },
            });
          }
          claimed.push(candidate);
        }
        return claimed;
      });

      if (cancelled.length === 0) break;
      expired += cancelled.length;

      const results = await Promise.allSettled(cancelled.map(async (candidate) => {
        try {
          const refund = await processRefund(candidate.id, "system:owner-response-timeout");
          if (refund.automatic) {
            refundsStarted += 1;
            return;
          }
          refundsNeedingReview += 1;
        } catch (err) {
          refundsNeedingReview += 1;
          const summary = getSafeErrorSummary(err);
          logOperationalEvent("error", "payment.reconciliation_required", {
            entity_type: "booking",
            entity_id: hashOperationalIdentifier(`booking:${candidate.id}`),
            reason: "owner_response_timeout_refund_failed",
            error_name: summary.name,
            ...(summary.code ? { error_code: summary.code } : {}),
          }, cronContext);
        }

        const booking = await db.booking.findUnique({
          where: { id: candidate.id },
          include: {
            user: { select: { name: true, email: true } },
            hostel: { select: { name: true } },
          },
        });
        if (!booking) return;
        void sendEmail(bookingStatusEmail({
          studentName: booking.user.name,
          studentEmail: booking.user.email,
          hostelName: booking.hostel.name,
          hostelSlug: "",
          bookingId: booking.id,
          status: "CANCELLED",
          refundPending: true,
        })).catch(() => undefined);
        void createNotification({
          userId: booking.userId,
          type: "BOOKING_CANCELLED",
          title: "Request expired — refund being checked",
          message: `The owner did not respond to your request for ${booking.hostel.name}. The booking was cancelled and the refund needs review.`,
          bookingId: booking.id,
          hostelId: booking.hostelId,
        });
      }));

      for (const result of results) {
        if (result.status === "rejected") {
          const summary = getSafeErrorSummary(result.reason);
          logOperationalEvent("error", "payment.reconciliation_required", {
            reason: "owner_response_timeout_processing_failed",
            error_name: summary.name,
            ...(summary.code ? { error_code: summary.code } : {}),
          }, cronContext);
        }
      }

      if (expiredCandidates.length < BATCH_SIZE) break;
    }

    return {
      message: "Owner response reminders and expirations processed",
      count: expired,
      remindersSent,
      refundsStarted,
      refundsNeedingReview,
    };
  }, logContext);
}
