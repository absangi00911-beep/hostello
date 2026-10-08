// Path: src/app/api/payment/callback/route.ts
/**
 * POST /api/payment/callback
 *
 * Handles signed JazzCash callbacks and fails closed for EasyPaisa.
 * Gateways POST form data to this URL (the returnURL / postBackURL).
 * GET requests are read-only browser returns and cannot settle a payment.
 *
 * Security:
 *   - POST requests are exempted from CSRF origin checks in middleware.ts because
 *     the POST originates from the payment gateway server, not the user's browser.
 *   - GET only redirects to the payment page and never changes booking state.
 *   - JazzCash callbacks are HMAC-verified and checked against the booking state/provider/amount.
 *   - EasyPaisa redirect callbacks are unsigned and never settle a payment.
 *   - Optional IP allowlisting can be enabled via GATEWAY_IPS environment variable
 *     for defense-in-depth (blocks requests from unexpected sources).
 *
 * After verifying the payment this route:
 *   1. Confirms the booking in the database.
 *   2. Sends the student a confirmation email.
 *   3. Redirects the browser to the existing booking confirmation/payment page.
 */

import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAppOrigin } from "@/lib/app-url";
import { parseJazzCashCallback } from "@/lib/jazzcash";
import { sendEmail } from "@/lib/email";
import { bookingStatusEmail } from "@/lib/email-templates/booking-status";
import { verifyGatewayIp } from "@/lib/gateway-ip-allowlist";
import { getSafeErrorSummary } from "@/lib/safe-error";
import { readBoundedText } from "@/lib/bounded-json";
import { PAYMENT_METHODS } from "@/lib/payment-methods";

const APP_URL = getAppOrigin();
const MAX_CALLBACK_BODY_BYTES = 16 * 1024;

type CallbackBodyResult =
  | { ok: true; data: Record<string, string> }
  | { ok: false; status: 400 | 413; error: string };

// -- Helpers -------------------------------------------------------------------

/** Parse an application/x-www-form-urlencoded body into a plain object. */
async function parseFormBody(req: NextRequest): Promise<CallbackBodyResult> {
  const contentType = req.headers.get("content-type") ?? "";
  const data: Record<string, string> = {};

  if (
    !contentType.includes("application/x-www-form-urlencoded") &&
    !contentType.includes("application/json")
  ) {
    return { ok: true, data };
  }

  let boundedBody;
  try {
    boundedBody = await readBoundedText(req, MAX_CALLBACK_BODY_BYTES);
  } catch {
    return { ok: false, status: 400, error: "Invalid callback body." };
  }
  if (!boundedBody.ok) return boundedBody;

  if (contentType.includes("application/x-www-form-urlencoded")) {
    new URLSearchParams(boundedBody.text).forEach((v, k) => { data[k] = v; });
    return { ok: true, data };
  }

  // Some gateway implementations send JSON
  if (contentType.includes("application/json")) {
    try {
      const json = JSON.parse(boundedBody.text);
      if (json && typeof json === "object" && !Array.isArray(json)) {
        Object.entries(json).forEach(([k, v]) => { data[k] = String(v); });
      } else {
        return { ok: false, status: 400, error: "Invalid callback body." };
      }
    } catch {
      return { ok: false, status: 400, error: "Invalid callback body." };
    }
    return { ok: true, data };
  }

  return { ok: true, data };
}

/**
 * Atomically confirm a booking after a successful payment.
 *
 * Guards:
 *   - Idempotent: returns early if already PAID.
 *   - Amount check: rejects if the paid amount differs from booking.total by > 1 PKR.
 */
async function confirmBooking(
  bookingId: string,
  transactionId: string,
  paidAmount: number,
  provider: "jazzcash",
) {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      user:   { select: { name: true, email: true } },
      hostel: { select: { name: true, slug: true } },
    },
  });

  if (!booking) {
    throw new Error(`Booking ${bookingId} not found`);
  }

  if (booking.paymentMethod !== provider) {
    throw new Error(`Payment provider mismatch for booking ${bookingId}.`);
  }
  if (!transactionId) throw new Error(`Provider transaction reference is missing for booking ${bookingId}.`);

  // Idempotency guard — only treat this as a duplicate if it matches the
  // payment that was already recorded.
  if (booking.paymentStatus === "PAID") {
    if (booking.transactionId && booking.transactionId !== transactionId) {
      throw new Error(`A different provider transaction is already recorded for booking ${bookingId}.`);
    }
    console.warn("[callback] Duplicate paid booking callback ignored");
    return booking;
  }

  if (booking.paymentStatus !== "PENDING" || !["PENDING", "CANCELLED"].includes(booking.status)) {
    throw new Error(`Booking ${bookingId} is not eligible for a payment callback.`);
  }

  // Amount verification — allow ±1 PKR for rounding differences
  const expected = Math.round(booking.total);
  const received = Math.round(paidAmount);
  if (Math.abs(expected - received) > 1) {
    throw new Error(
      `Amount mismatch on booking ${bookingId}: expected PKR ${expected}, received PKR ${received}`,
    );
  }

  const statusBeforePayment = booking.status;
  const result = await db.booking.updateMany({
    where: {
      id: bookingId,
      paymentMethod: provider,
      paymentStatus: "PENDING",
      status: statusBeforePayment,
    },
    data: {
      paymentStatus: "PAID",
      ...(statusBeforePayment === "PENDING" ? { status: "CONFIRMED" } : {}),
      transactionId: transactionId || null,
    },
  });

  if (result.count === 0) {
    const latest = await db.booking.findUnique({ where: { id: bookingId } });
    if (latest?.paymentStatus === "PAID" && latest.transactionId === transactionId) return latest;
    throw new Error(`Booking ${bookingId} changed during payment confirmation.`);
  }

  // A delayed success after cancellation is recorded as paid but does not
  // revive the booking; this leaves it visible to the admin refund queue.
  if (statusBeforePayment === "PENDING") {
    sendEmail(
      bookingStatusEmail({
        studentName:  booking.user.name,
        studentEmail: booking.user.email,
        hostelName:   booking.hostel.name,
        hostelSlug:   booking.hostel.slug,
        bookingId:    booking.id,
        status:       "CONFIRMED",
      }),
    ).catch((err) =>
      console.error(
        "[callback] Confirmation email failed:",
        getSafeErrorSummary(err),
      ),
    );
  }

  return { ...booking, paymentStatus: "PAID", transactionId, status: statusBeforePayment === "PENDING" ? "CONFIRMED" : "CANCELLED" };
}

// -- Route handler -------------------------------------------------------------

async function handleCallback(req: NextRequest): Promise<NextResponse> {
  const url       = new URL(req.url);
  const provider  = url.searchParams.get("provider");
  const bookingId = url.searchParams.get("bookingId");

  if (url.search.length > MAX_CALLBACK_BODY_BYTES || (bookingId !== null && bookingId.length > 64)) {
    return NextResponse.redirect(`${APP_URL}/?payment=error`, 303);
  }

  if (!bookingId) {
    console.error("[callback] Missing bookingId in callback URL");
    return NextResponse.redirect(`${APP_URL}/?payment=error`, 303);
  }

  // EasyPaisa callbacks are unsigned. The provider is disabled until a
  // server-side transaction inquiry can independently verify the payment.
  if (provider === "easypaisa") {
    console.warn("[callback] Rejected unsigned EasyPaisa callback");
    return NextResponse.redirect(
      `${APP_URL}/booking/${encodeURIComponent(bookingId)}/payment?payment=unavailable`,
      303,
    );
  }

  if (provider === "jazzcash" && !PAYMENT_METHODS.find((method) => method.value === provider)?.enabled) {
    console.warn("[callback] Rejected callback for disabled payment provider");
    return NextResponse.redirect(
      `${APP_URL}/booking/${encodeURIComponent(bookingId)}/payment?payment=unavailable`,
      303,
    );
  }

  // -- IP verification (optional, defense-in-depth) ----------------------
  // If GATEWAY_IPS is configured, verify the request comes from an allowed IP.
  // This is optional; signature verification provides the primary security.
  if (provider) {
    const ipError = verifyGatewayIp(req, provider);
    if (ipError) {
      console.warn("[callback] Gateway IP verification failed");
      return NextResponse.redirect(
        `${APP_URL}/booking/${encodeURIComponent(bookingId)}/payment?payment=error`,
        303,
      );
    }
  }

  // Merge URL query params with body params (GET callbacks put everything in the URL)
  const parsedBody = await parseFormBody(req);
  if (!parsedBody.ok) {
    return NextResponse.json({ error: parsedBody.error }, { status: parsedBody.status });
  }
  const bodyData = parsedBody.data;
  const queryData: Record<string, string> = {};
  url.searchParams.forEach((v, k) => { queryData[k] = v; });
  const data = { ...queryData, ...bodyData };

  try {
    if (provider === "jazzcash") {
      const result = parseJazzCashCallback(data);

      if (!result.success) {
        console.warn(
          "[callback] JazzCash reported a failed payment",
        );
        return NextResponse.redirect(
          `${APP_URL}/booking/${encodeURIComponent(bookingId)}/payment?payment=failed&reason=${encodeURIComponent(result.responseMessage)}`,
          303,
        );
      }

      await confirmBooking(bookingId, result.txnRefNo, result.amount, "jazzcash");
      return NextResponse.redirect(
        `${APP_URL}/booking/${encodeURIComponent(bookingId)}/confirmation?payment=return`,
        303,
      );
    }

    console.error("[callback] Unknown payment provider");
    return NextResponse.redirect(`${APP_URL}/?payment=unknown-provider`, 303);
  } catch (err) {
    console.error("[callback] Payment callback processing failed:", getSafeErrorSummary(err));
    return NextResponse.redirect(
      `${APP_URL}/booking/${encodeURIComponent(bookingId)}/payment?payment=error`,
      303,
    );
  }
}

// JazzCash POSTs to this callback after payment. EasyPaisa is rejected above.
export async function POST(req: NextRequest) {
  return handleCallback(req);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const bookingId = url.searchParams.get("bookingId");

  if (url.search.length > MAX_CALLBACK_BODY_BYTES || !bookingId || bookingId.length > 64) {
    return NextResponse.redirect(`${APP_URL}/?payment=error`, 303);
  }

  return NextResponse.redirect(
    new URL(`/booking/${encodeURIComponent(bookingId)}/payment?payment=pending`, APP_URL),
    303,
  );
}
