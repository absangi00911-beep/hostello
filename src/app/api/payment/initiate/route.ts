// Path: src/app/api/payment/initiate/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { createCheckoutLink, createCheckoutSession } from "@/lib/safepay";
import { createJazzCashSession } from "@/lib/jazzcash";
import { createEasypaisaSession } from "@/lib/easypaisa";
import { rateLimit } from "@/lib/rate-limit";
import { getAppOrigin } from "@/lib/app-url";
import { PAYMENT_METHODS } from "@/lib/payment-methods";
import { getSafeErrorSummary } from "@/lib/safe-error";
import { readBoundedJson } from "@/lib/bounded-json";
import { z } from "zod";

const paymentRequestSchema = z.object({ bookingId: z.string().min(1).max(64) });

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 20 payment initiations per user per hour
    const rl = await rateLimit(`pay:${session.user.id}`, { limit: 20, windowMs: 60 * 60 * 1000 });
    if (!rl.ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

    const body = await readBoundedJson(req, 1_024);
    if (!body.ok) {
      return NextResponse.json({ error: body.error }, { status: body.status });
    }
    const parsed = paymentRequestSchema.safeParse(body.data);
    if (!parsed.success) {
      return NextResponse.json({ error: "bookingId required." }, { status: 400 });
    }
    const { bookingId } = parsed.data;

    const booking = await db.booking.findUnique({
      where: { id: bookingId, userId: session.user.id },
      select: {
        id: true,
        total: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        transactionId: true,
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
    const appUrl        = isMobile ? "https://hostello.app" : getAppOrigin();
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
    const checkoutOptions = {
      bookingId:     booking.id,
      orderId:       booking.id,
      appUrl,
      source: isMobile ? "mobile" as const : "hosted" as const,
      ...(isMobile && {
        redirectPath: `hostello://payment/return?bookingId=${encodeURIComponent(booking.id)}`,
        cancelPath: `hostello://payment/return?bookingId=${encodeURIComponent(booking.id)}`,
      }),
    };

    // Reuse the one outstanding tracker for a pending payment. This avoids
    // creating multiple independently payable sessions for a single booking.
    if (booking.paymentStatus === "PENDING" && booking.transactionId) {
      const checkout = await createCheckoutLink({
        ...checkoutOptions,
        token: booking.transactionId,
      });
      return NextResponse.json({ data: { paymentUrl: checkout.redirectUrl }, message: "Payment resumed" });
    }

    if (booking.paymentStatus !== "PENDING" && booking.paymentStatus !== "FAILED") {
      return NextResponse.json({ error: "Booking is not eligible for payment." }, { status: 400 });
    }

    const checkout = await createCheckoutSession({
      ...checkoutOptions,
      amount: booking.total,
      customerEmail: booking.user.email,
      customerName: booking.user.name,
    });

    // Persist the tracker in the existing transactionId field. A compare-and-
    // set makes concurrent initiation requests converge on one checkout link.
    const saved = await db.booking.updateMany({
      where: {
        id: booking.id,
        status: "PENDING",
        paymentStatus: booking.paymentStatus,
        transactionId: booking.transactionId,
      },
      data: { paymentStatus: "PENDING", transactionId: checkout.token },
    });

    if (saved.count === 0) {
      const current = await db.booking.findUnique({
        where: { id: booking.id },
        select: { status: true, paymentStatus: true, transactionId: true },
      });
      if (current?.status === "PENDING" && current.paymentStatus === "PENDING" && current.transactionId) {
        const resumed = await createCheckoutLink({ ...checkoutOptions, token: current.transactionId });
        return NextResponse.json({ data: { paymentUrl: resumed.redirectUrl }, message: "Payment resumed" });
      }
      return NextResponse.json({ error: "Booking changed while payment was being prepared. Please retry." }, { status: 409 });
    }

    return NextResponse.json({ data: { paymentUrl: checkout.redirectUrl }, message: "Payment initiated" });
  } catch (err) {
    console.error("[POST /api/payment/initiate]", getSafeErrorSummary(err));
    return NextResponse.json({ error: "Payment setup failed." }, { status: 500 });
  }
}
