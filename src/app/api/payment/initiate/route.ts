// Path: src/app/api/payment/initiate/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { createCheckoutSession } from "@/lib/safepay";
import { createJazzCashSession } from "@/lib/jazzcash";
import { createEasypaisaSession } from "@/lib/easypaisa";
import { rateLimit } from "@/lib/rate-limit";
import { getRequestOrigin } from "@/lib/app-url";
import { PAYMENT_METHODS } from "@/lib/payment-methods";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 20 payment initiations per user per hour
    const rl = await rateLimit(`pay:${session.user.id}`, { limit: 20, windowMs: 60 * 60 * 1000 });
    if (!rl.ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

    const { bookingId } = await req.json();
    if (!bookingId) return NextResponse.json({ error: "bookingId required." }, { status: 400 });

    const booking = await db.booking.findUnique({
      where: { id: bookingId, userId: session.user.id },
      select: {
        id: true,
        total: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        hostel: { select: { name: true } },
        user:   { select: { name: true, email: true } },
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

    const isMobile      = req.headers.get("x-client") === "mobile";
    const appUrl        = isMobile ? "https://hostello.app" : getRequestOrigin(req);
    const paymentMethod = booking.paymentMethod ?? "safepay";

    // Guard 3: reject disabled payment methods
    const method = PAYMENT_METHODS.find((m) => m.value === paymentMethod);
    if (!method?.enabled) {
      return NextResponse.json(
        { error: "Payment method not available." },
        { status: 400 }
      );
    }

    // -- JazzCash ------------------------------------------------------------
    if (paymentMethod === "jazzcash") {
      if (isMobile) {
        return NextResponse.json(
          { error: "JazzCash is not supported on mobile yet." },
          { status: 400 }
        );
      }
      const jcSession = createJazzCashSession({
        bookingId:   booking.id,
        amount:      booking.total,
        orderId:     booking.id,
        description: `Booking at ${booking.hostel.name}`,
        appUrl,
      });
      return NextResponse.json({
        type:    "form",
        formUrl: jcSession.formUrl,
        params:  jcSession.params,
      });
    }

    // -- EasyPaisa -----------------------------------------------------------
    if (paymentMethod === "easypaisa") {
      if (isMobile) {
        return NextResponse.json(
          { error: "EasyPaisa is not supported on mobile yet." },
          { status: 400 }
        );
      }
      const epSession = createEasypaisaSession({
        bookingId:     booking.id,
        amount:        booking.total,
        orderId:       booking.id,
        customerEmail: booking.user.email,
        appUrl,
      });
      return NextResponse.json({
        type:    "form",
        formUrl: epSession.formUrl,
        params:  epSession.params,
      });
    }

    // -- Safepay (default) ---------------------------------------------------
    const { redirectUrl } = await createCheckoutSession({
      bookingId:     booking.id,
      amount:        booking.total,
      orderId:       booking.id,
      customerEmail: booking.user.email,
      customerName:  booking.user.name,
      appUrl,
      ...(isMobile && { 
        redirectPath: `/booking/${booking.id}/confirm`,
        cancelPath: `/booking/${booking.id}?payment=cancelled`
      }),
    });

    return NextResponse.json({ type: "redirect", redirectUrl });
  } catch (err) {
    console.error("[POST /api/payment/initiate]", err);
    return NextResponse.json({ error: "Payment setup failed." }, { status: 500 });
  }
}
