import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/safepay";
import { sendEmail } from "@/lib/email";
import { bookingStatusEmail } from "@/lib/email-templates/booking-status";

export async function POST(req: NextRequest) {
  try {
    const rawBody  = await req.text();
    const signature = req.headers.get("x-sfpy-signature") ?? "";

    const valid = await verifyWebhookSignature(rawBody, signature);
    if (!valid) {
      console.warn("[webhook] Invalid Safepay signature — rejected");
      return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const type  = event?.type as string;

    if (type !== "payment:success") {
      return NextResponse.json({ received: true });
    }

    const orderId = event?.data?.order_id as string;
    if (!orderId) return NextResponse.json({ error: "No order_id." }, { status: 400 });

    const booking = await db.booking.findUnique({
      where: { id: orderId },
      include: {
        user:   { select: { name: true, email: true } },
        hostel: { select: { name: true, slug: true } },
      },
    });

    if (!booking) {
      console.error("[webhook] Booking not found for orderId:", orderId);
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    // Amount verification — REQUIRED to prevent free booking confirmation
    // Safepay sends amount in PKR integer. Field must always be present and match.
    const paidAmount = event?.data?.amount;
    if (typeof paidAmount !== "number") {
      console.error(
        `[webhook] Missing or invalid amount on booking ${orderId} — rejecting for security`
      );
      return NextResponse.json(
        { error: "Amount field required." },
        { status: 400 }
      );
    }

    const expectedAmount = Math.round(booking.total);
    if (paidAmount !== expectedAmount) {
      console.error(
        `[webhook] Amount mismatch on booking ${orderId}: ` +
        `expected PKR ${expectedAmount}, received PKR ${paidAmount}`
      );
      // Do NOT confirm the booking. Log for manual review.
      return NextResponse.json(
        { error: "Amount mismatch — booking held for manual review." },
        { status: 400 }
      );
    }

    // Use conditional update to ensure idempotency and prevent race conditions.
    // If this webhook fires twice simultaneously, only the first update succeeds.
    // The second will match 0 rows (booking is already PAID) and silently no-op.
    const result = await db.booking.updateMany({
      where: { 
        id: orderId,
        paymentStatus: { not: "PAID" },
      },
      data: {
        paymentStatus: "PAID",
        status: "CONFIRMED",
        transactionId: (event?.data?.transaction_id as string | undefined) ?? null,
      },
    });

    if (result.count === 0) {
      // Booking was already processed by a concurrent webhook or user action.
      // Return success to ack the webhook without re-processing.
      console.info(`[webhook] Booking ${orderId} already marked PAID — idempotent no-op`);
      return NextResponse.json({ received: true });
    }

    sendEmail(
      bookingStatusEmail({
        studentName:  booking.user.name,
        studentEmail: booking.user.email,
        hostelName:   booking.hostel.name,
        hostelSlug:   booking.hostel.slug,
        bookingId:    booking.id,
        status:       "CONFIRMED",
      })
    ).catch(() => {});

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[POST /api/payment/webhook]", err);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}