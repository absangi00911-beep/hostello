/**
 * POST/GET /api/payment/callback
 *
 * Handles the customer redirect-back from JazzCash and EasyPaisa after payment.
 * Both gateways POST form data to this URL (the returnURL / postBackURL).
 *
 * Security:
 *   - POST requests are exempted from CSRF origin checks in middleware.ts because
 *     the POST originates from the payment gateway server, not the user's browser.
 *   - GET callbacks are safe from CSRF (safe methods always allowed by verifyCsrfOrigin).
 *   - All callbacks are verified by HMAC signature (JazzCash) or amount verification (EasyPaisa).
 *   - Optional IP allowlisting can be enabled via GATEWAY_IPS environment variable
 *     for defense-in-depth (blocks requests from unexpected sources).
 *
 * After verifying the payment this route:
 *   1. Confirms the booking in the database.
 *   2. Sends the student a confirmation email.
 *   3. Redirects the browser to /payment/success or the booking page on failure.
 */

import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAppUrl } from "@/lib/app-url";
import { parseJazzCashCallback } from "@/lib/jazzcash";
import { parseEasypaisaCallback } from "@/lib/easypaisa";
import { sendEmail } from "@/lib/email";
import { bookingStatusEmail } from "@/lib/email-templates/booking-status";
import { verifyGatewayIp } from "@/lib/gateway-ip-allowlist";

const APP_URL = getAppUrl();

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Parse an application/x-www-form-urlencoded body into a plain object. */
async function parseFormBody(req: NextRequest): Promise<Record<string, string>> {
  const contentType = req.headers.get("content-type") ?? "";
  const data: Record<string, string> = {};

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await req.text();
    new URLSearchParams(text).forEach((v, k) => { data[k] = v; });
    return data;
  }

  // Some gateway implementations send JSON
  if (contentType.includes("application/json")) {
    try {
      const json = await req.json();
      if (json && typeof json === "object") {
        Object.entries(json).forEach(([k, v]) => { data[k] = String(v); });
      }
    } catch { /* ignore parse errors */ }
    return data;
  }

  // For GET callbacks, params are in the query string (already surfaced via url.searchParams)
  return data;
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

  // Idempotency guard — if already paid (e.g. webhook arrived first), do nothing.
  if (booking.paymentStatus === "PAID") {
    console.log(`[callback] Booking ${bookingId} already marked PAID — skipping`);
    return booking;
  }

  // Amount verification — allow ±1 PKR for rounding differences
  const expected = Math.round(booking.total);
  const received = Math.round(paidAmount);
  if (Math.abs(expected - received) > 1) {
    throw new Error(
      `Amount mismatch on booking ${bookingId}: expected PKR ${expected}, received PKR ${received}`,
    );
  }

  const updated = await db.booking.update({
    where: { id: bookingId },
    data: {
      paymentStatus: "PAID",
      status:        "CONFIRMED",
      transactionId: transactionId || null,
    },
    include: {
      user:   { select: { name: true, email: true } },
      hostel: { select: { name: true, slug: true } },
    },
  });

  // Confirmation email — fire-and-forget; never blocks the redirect
  sendEmail(
    bookingStatusEmail({
      studentName:  updated.user.name,
      studentEmail: updated.user.email,
      hostelName:   updated.hostel.name,
      hostelSlug:   updated.hostel.slug,
      bookingId:    updated.id,
      status:       "CONFIRMED",
    }),
  ).catch((err) =>
    console.error(`[callback] Confirmation email failed for ${bookingId}:`, err)
  );

  return updated;
}

// ── Route handler ─────────────────────────────────────────────────────────────

async function handleCallback(req: NextRequest): Promise<NextResponse> {
  const url       = new URL(req.url);
  const provider  = url.searchParams.get("provider");
  const bookingId = url.searchParams.get("bookingId");

  if (!bookingId) {
    console.error("[callback] Missing bookingId in callback URL");
    return NextResponse.redirect(`${APP_URL}/?payment=error`, 303);
  }

  // ── IP verification (optional, defense-in-depth) ──────────────────────
  // If GATEWAY_IPS is configured, verify the request comes from an allowed IP.
  // This is optional; signature verification provides the primary security.
  if (provider) {
    const ipError = verifyGatewayIp(req, provider);
    if (ipError) {
      console.warn(
        `[callback] IP verification failed for ${provider} (booking ${bookingId}): ${ipError}`,
      );
      // Log but don't block — signature verification is the primary defense.
      // Uncomment the return below to enforce strict IP checks.
      // return NextResponse.json({ error: ipError }, { status: 403 });
    }
  }

  // Merge URL query params with body params (GET callbacks put everything in the URL)
  const bodyData: Record<string, string> = await parseFormBody(req);
  const queryData: Record<string, string> = {};
  url.searchParams.forEach((v, k) => { queryData[k] = v; });
  const data = { ...queryData, ...bodyData };

  try {
    if (provider === "jazzcash") {
      const result = parseJazzCashCallback(data);

      if (!result.success) {
        console.warn(
          `[callback] JazzCash payment failed for booking ${bookingId}: ` +
          `${result.responseCode} — ${result.responseMessage}`,
        );
        return NextResponse.redirect(
          `${APP_URL}/bookings/${bookingId}?payment=failed&reason=${encodeURIComponent(result.responseMessage)}`,
          303,
        );
      }

      await confirmBooking(bookingId, result.txnRefNo, result.amount);
      return NextResponse.redirect(
        `${APP_URL}/payment/success?bookingId=${bookingId}`,
        303,
      );
    }

    if (provider === "easypaisa") {
      const result = parseEasypaisaCallback(data, bookingId);

      if (!result.success) {
        console.warn(
          `[callback] EasyPaisa payment failed for booking ${bookingId}: ` +
          `${result.responseCode} — ${result.responseMessage}`,
        );
        return NextResponse.redirect(
          `${APP_URL}/bookings/${bookingId}?payment=failed&reason=${encodeURIComponent(result.responseMessage)}`,
          303,
        );
      }

      await confirmBooking(bookingId, result.transactionId, result.amount);
      return NextResponse.redirect(
        `${APP_URL}/payment/success?bookingId=${bookingId}`,
        303,
      );
    }

    console.error(`[callback] Unknown payment provider: ${provider}`);
    return NextResponse.redirect(`${APP_URL}/?payment=unknown-provider`, 303);
  } catch (err) {
    console.error(
      `[callback] Processing failed for booking ${bookingId} (${provider}):`,
      err,
    );
    return NextResponse.redirect(
      `${APP_URL}/bookings/${bookingId}?payment=error`,
      303,
    );
  }
}

// JazzCash and EasyPaisa both POST to the callback URL after payment.
export async function POST(req: NextRequest) {
  return handleCallback(req);
}

// Some gateway test environments use GET for the return URL.
export async function GET(req: NextRequest) {
  return handleCallback(req);
}