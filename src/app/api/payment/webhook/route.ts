import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/safepay";
import { sendEmail } from "@/lib/email";
import { bookingStatusEmail } from "@/lib/email-templates/booking-status";

export async function POST(req: NextRequest) {
  try {
    const rawBody  = await req.text();
    const signature = req.headers.get("x-sfpy-signature") ?? "";

    // Verify webhook is genuinely from Safepay
    const valid = await verifyWebhookSignature(rawBody, signature);
    if (!valid) {
      console.warn("[webhook] Invalid Safepay signature — rejected");
      return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const type  = event?.type as string;

    // Only handle successful payments
    if (type !== "payment:success") {
      return NextResponse.json({ received: true });
    }

    const orderId = event?.data?.order_id as string;
    if (!orderId) return NextResponse.json({ error: "No order_id." }, { status: 400 });

    // orderId is the bookingId (set in createCheckoutSession)
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

    if (booking.paymentStatus === "PAID") {
      // Already processed — idempotent response
      return NextResponse.json({ received: true });
    }

    await db.booking.update({
      where: { id: orderId },
      data: {
        paymentStatus: "PAID",
        status:        "CONFIRMED",
        transactionId: event?.data?.transaction_id ?? null,
      },
    });

    // Notify student that payment + confirmation is done
    sendEmail(
      bookingStatusEmail({
        studentName:  booking.user.name,
        studentEmail: booking.user.email,
        hostelName:   booking.hostel.name,
        hostelSlug:   booking.hostel.slug,
        bookingId:    booking.id,
        status:       "CONFIRMED",
      })
    ).catch(() => {
      // Silently ignore email failures
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[POST /api/payment/webhook]", err);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
