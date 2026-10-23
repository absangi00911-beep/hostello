import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { getSafeErrorSummary } from "@/lib/safe-error";

const REFUND_RECONCILIATION_AGE_MS = 5 * 60 * 1000;

export async function GET(req: Request) {
  const internalSecret = req.headers.get("x-cron-health-secret");
  const isInternal = Boolean(process.env.CRON_SECRET) && internalSecret === process.env.CRON_SECRET;
  if (!isInternal) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const reconciliationBefore = new Date(now.getTime() - REFUND_RECONCILIATION_AGE_MS);

  try {
    const [
      unansweredBookings,
      overdueUnpaidCheckouts,
      refundIssues,
      retryableWebhookEvents,
      reconciliationRequiredWebhookEvents,
    ] = await Promise.all([
      db.booking.count({
        where: {
          status: "PENDING",
          paymentStatus: "PAID",
          OR: [
            { ownerResponseDueAt: { lt: now } },
            { ownerResponseDueAt: null, createdAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
          ],
        },
      }),
      db.booking.count({
        where: {
          status: "PENDING",
          paymentStatus: "PENDING",
          createdAt: { lt: new Date(now.getTime() - 30 * 60 * 1000) },
        },
      }),
      db.booking.count({
        where: {
          status: "CANCELLED",
          paymentStatus: { in: ["PAID", "PARTIALLY_REFUNDED"] },
          OR: [
            { refundState: "UNCERTAIN" },
            { refundState: "NONE", OR: [{ cancellationRefundAmount: null }, { cancellationRefundAmount: { gt: 0 } }] },
            { refundState: "PROCESSING", updatedAt: { lt: reconciliationBefore } },
          ],
        },
      }),
      db.safepayWebhookEvent.count({
        where: { status: "RETRYABLE" },
      }),
      db.safepayWebhookEvent.count({
        where: { status: "RECONCILIATION_REQUIRED" },
      }),
    ]);

    const webhookIssues = retryableWebhookEvents + reconciliationRequiredWebhookEvents;
    const healthy = unansweredBookings === 0 && overdueUnpaidCheckouts === 0 && refundIssues === 0 && webhookIssues === 0;
    return NextResponse.json({
      healthy,
      checkedAt: now.toISOString(),
      counts: {
        unansweredBookings,
        overdueUnpaidCheckouts,
        refundIssues,
        retryableWebhookEvents,
        reconciliationRequiredWebhookEvents,
        webhookIssues,
      },
    }, { status: healthy ? 200 : 207 });
  } catch (err) {
    console.error("[GET /api/health/payments]", getSafeErrorSummary(err));
    return NextResponse.json({ error: "Payment health check unavailable" }, { status: 500 });
  }
}
