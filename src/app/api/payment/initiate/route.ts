import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { createCheckoutSession } from "@/lib/safepay";
import { rateLimit, getIp } from "@/lib/rate-limit";
import { getRequestOrigin } from "@/lib/app-url";

export async function POST(req: NextRequest) {
  // 20 payment initiations per IP per hour
  const rl = await rateLimit(`pay:${getIp(req)}`, { limit: 20, windowMs: 60 * 60 * 1000 });
  if (!rl.ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { bookingId } = await req.json();
    if (!bookingId) return NextResponse.json({ error: "bookingId required." }, { status: 400 });

    const booking = await db.booking.findUnique({
      where: { id: bookingId, userId: session.user.id },
      select: {
        id: true,
        total: true,
        status: true,
        paymentStatus: true,
        user: { select: { name: true, email: true } },
      },
    });

    if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

    // Guard 1: only initiate payment for bookings that are still pending.
    // Without this check a cancelled or completed booking could be re-paid,
    // creating a confirmed booking that was already cancelled/refunded.
    if (booking.status !== "PENDING") {
      return NextResponse.json(
        { error: `Cannot pay for a booking with status "${booking.status}".` },
        { status: 400 }
      );
    }

    // Guard 2: idempotency — never double-charge an already-paid booking.
    if (booking.paymentStatus === "PAID") {
      return NextResponse.json({ error: "Booking is already paid." }, { status: 400 });
    }

    const { redirectUrl } = await createCheckoutSession({
      bookingId: booking.id,
      amount:    booking.total,
      orderId:   booking.id,
      customerEmail: booking.user.email,
      customerName:  booking.user.name,
      appUrl: getRequestOrigin(req),
    });

    return NextResponse.json({ redirectUrl });
  } catch (err) {
    console.error("[POST /api/payment/initiate]", err);
    return NextResponse.json({ error: "Payment setup failed." }, { status: 500 });
  }
}