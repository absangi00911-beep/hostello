import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { bookingConfirmationEmail, bookingNotificationEmail } from "@/lib/email-templates/booking";
import type { Prisma } from "@/generated/client";

export const PAYMENT_EMAIL_MAX_ATTEMPTS = 8;
export const PAYMENT_EMAIL_SUCCESS_RETENTION_MS = 24 * 60 * 60 * 1000;
export const PAYMENT_EMAIL_FAILED_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const CLAIM_LEASE_MS = 5 * 60 * 1000;
const MAX_PER_RUN = 20;
const MAX_PARALLEL_SENDS = 5;
const MAX_RETRY_DELAY_MS = 6 * 60 * 60 * 1000;

type SafeErrorCode = "EVENT_UNAVAILABLE" | "RECIPIENT_MISMATCH" | "RENDER_FAILURE" | "PROVIDER_FAILURE" | "RETRY_LIMIT";

/**
 * Enqueue both confirmation events inside the payment-state transaction. These
 * rows contain references and delivery state only, never email content or PII.
 */
export async function enqueuePaymentConfirmationEmails(
  tx: Prisma.TransactionClient,
  event: { bookingId: string; studentUserId: string; ownerUserId: string },
  now = new Date(),
): Promise<void> {
  const data = [
    {
      bookingId: event.bookingId,
      recipientUserId: event.ownerUserId,
      template: "BOOKING_REQUEST_EMAIL_TO_OWNER" as const,
      idempotencyKey: `payment-confirmation:${event.bookingId}:owner`,
      expiresAt: new Date(now.getTime() + PAYMENT_EMAIL_FAILED_RETENTION_MS),
    },
    {
      bookingId: event.bookingId,
      recipientUserId: event.studentUserId,
      template: "BOOKING_REQUEST_EMAIL_TO_STUDENT" as const,
      idempotencyKey: `payment-confirmation:${event.bookingId}:student`,
      expiresAt: new Date(now.getTime() + PAYMENT_EMAIL_FAILED_RETENTION_MS),
    },
  ];
  await tx.paymentEmailOutbox.createMany({ data, skipDuplicates: true });
}

async function deliverPaymentEmail(id: string): Promise<SafeErrorCode | null> {
  try {
    const item = await db.paymentEmailOutbox.findUnique({
      where: { id },
      select: {
        id: true,
        recipientUserId: true,
        bookingId: true,
        template: true,
        idempotencyKey: true,
        recipient: { select: { id: true, name: true, email: true } },
        booking: {
          select: {
            id: true,
            userId: true,
            status: true,
            paymentStatus: true,
            checkIn: true,
            checkOut: true,
            months: true,
            total: true,
            paymentMethod: true,
            user: { select: { id: true, name: true, email: true } },
            hostel: {
              select: {
                name: true,
                slug: true,
                ownerId: true,
                owner: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
      },
    });
    if (!item || !item.booking || item.booking.paymentStatus !== "PAID" || item.booking.status === "CANCELLED") {
      return "EVENT_UNAVAILABLE";
    }

    const recipientIsOwner = item.template === "BOOKING_REQUEST_EMAIL_TO_OWNER" &&
      item.booking.hostel.ownerId === item.recipientUserId;
    const recipientIsStudent = item.template === "BOOKING_REQUEST_EMAIL_TO_STUDENT" &&
      item.booking.userId === item.recipientUserId;
    if (
      item.recipient.id !== item.recipientUserId ||
      (!recipientIsOwner && !recipientIsStudent) ||
      !item.recipient.email
    ) {
      return "RECIPIENT_MISMATCH";
    }

    const props = {
      studentName: item.booking.user.name,
      studentEmail: item.booking.user.email,
      ownerName: item.booking.hostel.owner.name,
      ownerEmail: item.booking.hostel.owner.email,
      hostelName: item.booking.hostel.name,
      hostelSlug: item.booking.hostel.slug,
      bookingId: item.booking.id,
      checkIn: item.booking.checkIn,
      checkOut: item.booking.checkOut,
      months: item.booking.months,
      total: item.booking.total,
      paymentMethod: item.booking.paymentMethod ?? "Payment gateway",
    };
    const message = recipientIsOwner
      ? bookingNotificationEmail(props)
      : bookingConfirmationEmail(props);
    // Provider payload/response and raw provider errors never enter storage/logs.
    const result = await sendEmail(message, {
      idempotencyKey: item.idempotencyKey,
      suppressErrorLogs: true,
    });
    return result.success ? null : "PROVIDER_FAILURE";
  } catch {
    return "RENDER_FAILURE";
  }
}

async function processOne(id: string, previousAttempts: number, now: Date) {
  const staleBefore = new Date(now.getTime() - CLAIM_LEASE_MS);
  const claimed = await db.paymentEmailOutbox.updateMany({
    where: {
      id,
      expiresAt: { gt: now },
      OR: [
        { status: { in: ["PENDING", "RETRY"] }, nextAttemptAt: { lte: now } },
        { status: "PROCESSING", lastAttemptAt: { lte: staleBefore } },
      ],
    },
    data: {
      status: "PROCESSING",
      attemptCount: { increment: 1 },
      lastAttemptAt: now,
      lastErrorCode: null,
    },
  });
  if (claimed.count === 0) return "skipped" as const;

  const attempt = previousAttempts + 1;
  if (attempt > PAYMENT_EMAIL_MAX_ATTEMPTS) {
    await db.paymentEmailOutbox.updateMany({
      where: { id, status: "PROCESSING" },
      data: {
        status: "DEAD",
        lastErrorCode: "RETRY_LIMIT",
        expiresAt: new Date(now.getTime() + PAYMENT_EMAIL_FAILED_RETENTION_MS),
      },
    });
    return "dead" as const;
  }

  const errorCode = await deliverPaymentEmail(id);
  if (!errorCode) {
    await db.paymentEmailOutbox.updateMany({
      where: { id, status: "PROCESSING" },
      data: {
        status: "SENT",
        sentAt: now,
        expiresAt: new Date(now.getTime() + PAYMENT_EMAIL_SUCCESS_RETENTION_MS),
        lastErrorCode: null,
      },
    });
    return "sent" as const;
  }

  const dead = attempt >= PAYMENT_EMAIL_MAX_ATTEMPTS;
  const delayMs = Math.min(MAX_RETRY_DELAY_MS, 60_000 * (2 ** Math.min(attempt - 1, 16)));
  await db.paymentEmailOutbox.updateMany({
    where: { id, status: "PROCESSING" },
    data: {
      status: dead ? "DEAD" : "RETRY",
      nextAttemptAt: new Date(now.getTime() + delayMs),
      lastErrorCode: errorCode,
      ...(dead ? { expiresAt: new Date(now.getTime() + PAYMENT_EMAIL_FAILED_RETENTION_MS) } : {}),
    },
  });
  return dead ? "dead" as const : "retry" as const;
}

/** Bounded QStash worker; duplicate invocations race on a conditional claim. */
export async function drainPaymentEmailOutbox(now = new Date()): Promise<{
  scanned: number;
  sent: number;
  retried: number;
  dead: number;
  skipped: number;
  deleted: number;
}> {
  const cleanup = await db.paymentEmailOutbox.deleteMany({
    where: { expiresAt: { lte: now } },
  });
  const candidates = await db.paymentEmailOutbox.findMany({
    where: {
      expiresAt: { gt: now },
      OR: [
        { status: { in: ["PENDING", "RETRY"] }, nextAttemptAt: { lte: now } },
        { status: "PROCESSING", lastAttemptAt: { lte: new Date(now.getTime() - CLAIM_LEASE_MS) } },
      ],
    },
    orderBy: [{ nextAttemptAt: "asc" }, { createdAt: "asc" }],
    take: MAX_PER_RUN,
    select: { id: true, attemptCount: true },
  });

  const counts = { sent: 0, retried: 0, dead: 0, skipped: 0 };
  for (let offset = 0; offset < candidates.length; offset += MAX_PARALLEL_SENDS) {
    const group = candidates.slice(offset, offset + MAX_PARALLEL_SENDS);
    const outcomes = await Promise.all(group.map((item) => processOne(item.id, item.attemptCount, now)));
    for (const outcome of outcomes) {
      const countKey = outcome === "retry" ? "retried" : outcome;
      counts[countKey]++;
    }
  }

  return { scanned: candidates.length, ...counts, deleted: cleanup.count };
}
