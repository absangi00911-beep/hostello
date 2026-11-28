"use client";

import { AuthNotice } from "@/components/auth/AuthNotice";
import {
  StatusBadge,
  bookingStatusTone,
  type StatusTone,
} from "@/components/ui/StatusBadge";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState, useRef } from "react";
import { formatPrice } from "@hostello/shared";
import { BookingReviewForm } from "./BookingReviewForm";
import {
  CANCELLATION_POLICY_DETAILS,
  type CancellationPolicy,
} from "@/lib/cancellation-policy";

const bookingStatuses = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
} as const;

const paymentStatuses = {
  PENDING: "Payment pending",
  PAID: "Paid",
  PARTIALLY_REFUNDED: "Partially refunded",
  REFUNDED: "Refunded",
  FAILED: "Payment failed",
} as const;

type BookingStatus = keyof typeof bookingStatuses;
type PaymentStatus = keyof typeof paymentStatuses;

export interface StudentBookingDetail {
  id: string;
  checkIn: string;
  checkOut: string;
  months: number;
  guests: number;
  total: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  cancellationPolicy: CancellationPolicy | null;
  ownerResponseDueAt: string | null;
  hostel: {
    id: string;
    name: string;
    slug: string;
    coverImage: string | null;
    city: string;
    area: string | null;
    address: string | null;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isOneOf<T extends string>(
  value: unknown,
  allowed: Record<T, string>,
): value is T {
  return typeof value === "string" && Object.hasOwn(allowed, value);
}

export function parseBookingDetail(value: unknown): StudentBookingDetail | null {
  if (!isRecord(value) || !isRecord(value.data)) return null;
  const booking = value.data;
  const hostel = booking.hostel;

  if (
    typeof booking.id !== "string" ||
    typeof booking.checkIn !== "string" ||
    typeof booking.checkOut !== "string" ||
    typeof booking.months !== "number" ||
    typeof booking.guests !== "number" ||
    typeof booking.total !== "number" ||
    !Number.isFinite(booking.total) ||
    !isOneOf(booking.status, bookingStatuses) ||
    !isOneOf(booking.paymentStatus, paymentStatuses) ||
    !isRecord(hostel) ||
    typeof hostel.id !== "string" ||
    typeof hostel.name !== "string" ||
    typeof hostel.slug !== "string" ||
    typeof hostel.city !== "string"
  ) {
    return null;
  }

  const policy = booking.cancellationPolicy;

  return {
    id: booking.id,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    months: booking.months,
    guests: booking.guests,
    total: booking.total,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    cancellationPolicy:
      typeof policy === "string" && Object.hasOwn(CANCELLATION_POLICY_DETAILS, policy)
        ? (policy as CancellationPolicy)
        : null,
    ownerResponseDueAt:
      typeof booking.ownerResponseDueAt === "string"
        ? booking.ownerResponseDueAt
        : null,
    hostel: {
      id: hostel.id,
      name: hostel.name,
      slug: hostel.slug,
      coverImage: typeof hostel.coverImage === "string" ? hostel.coverImage : null,
      city: hostel.city,
      area: typeof hostel.area === "string" ? hostel.area : null,
      address: typeof hostel.address === "string" ? hostel.address : null,
    },
  };
}

function readApiError(value: unknown, fallback: string): string {
  return isRecord(value) && typeof value.error === "string"
    ? value.error
    : fallback;
}

function readMessage(value: unknown): string | null {
  return isRecord(value) && typeof value.message === "string"
    ? value.message
    : null;
}

const paymentNotices: Record<string, string> = {
  cancelled: "Checkout was cancelled. Your booking is saved and not yet paid.",
  failed: "The payment did not go through. You can try again.",
  pending: "We're still waiting for the payment provider to confirm your payment.",
  unavailable: "That payment method is not available right now.",
  error: "Something went wrong with the payment. You can try again.",
  return: "Thanks. We're confirming your payment with the provider.",
  "unknown-provider": "That payment method is not available right now.",
};

export function getPaymentNotice(code: string | null): string | null {
  if (!code || !Object.hasOwn(paymentNotices, code)) return null;
  return paymentNotices[code];
}

// Safepay marks a booking paid via an asynchronous webhook, so the booking can
// still read "payment pending" for a few seconds after the customer returns.
const CONFIRMATION_POLL_MS = 3_000;
const CONFIRMATION_MAX_CHECKS = 20;

const problemPaymentCodes = new Set(["failed", "error", "unavailable", "unknown-provider"]);

/**
 * Picks the payment banner. The booking's server-side payment status decides what we claim:
 * a URL code alone never says "paid", and a leftover code (for example "cancelled" after an
 * earlier payment already went through) never contradicts a booking the server reports as paid.
 */
export function getPaymentNoticeForBooking(
  code: string | null,
  paymentStatus: PaymentStatus | null,
): { message: string; isProblem: boolean } | null {
  if (paymentStatus === "PAID") {
    return isReturnFromCheckout(code)
      ? { message: "Payment received. Thank you!", isProblem: false }
      : null;
  }
  const message = getPaymentNotice(code);
  if (!message) return null;
  return { message, isProblem: code !== null && problemPaymentCodes.has(code) };
}

export function isReturnFromCheckout(code: string | null): boolean {
  return code === "return" || code === "pending";
}

// Hostels are in Pakistan, so show every date in that zone instead of the viewer's. This is
// right for calendar dates stored at UTC or Pakistan midnight and for timestamps like the
// owner's response deadline.
const dateFormatter = new Intl.DateTimeFormat("en-PK", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Karachi",
});

const paymentStatusTone: Record<PaymentStatus, StatusTone> = {
  PENDING: "warning",
  PAID: "info",
  FAILED: "danger",
  PARTIALLY_REFUNDED: "neutral",
  REFUNDED: "neutral",
};

const primaryButtonClassName =
  "inline-flex min-h-[46px] cursor-pointer items-center justify-center rounded-[8px] border-0 bg-brand px-5 text-body font-[650] text-white enabled:hover:bg-brand-dark disabled:cursor-wait disabled:opacity-70";
const secondaryButtonClassName =
  "inline-flex min-h-[46px] cursor-pointer items-center justify-center rounded-[8px] border border-line bg-white px-5 text-body font-semibold text-ink no-underline shadow-[0_1px_2px_rgb(15_23_42/0.06)] transition-[background-color,border-color,box-shadow,translate] duration-150 enabled:hover:border-line-strong enabled:hover:bg-surface-muted active:translate-y-px active:bg-line active:shadow-none disabled:shadow-none disabled:active:translate-y-0 motion-reduce:transition-none motion-reduce:active:translate-y-0 disabled:cursor-wait disabled:opacity-70 btn-secondary";

export function BookingDetailPage({
  bookingId,
  paymentCode,
}: {
  bookingId: string;
  paymentCode: string | null;
}) {
  const [booking, setBooking] = useState<StudentBookingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const [pollRound, setPollRound] = useState(0);
  const confirmPanelRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const restoreCancelFocus = useRef(false);

  // The "Cancel booking" button is replaced by the confirmation panel, so move focus into the
  // panel, and back to the button if the person keeps the booking.
  useEffect(() => {
    if (confirmingCancel) {
      confirmPanelRef.current?.focus();
    } else if (restoreCancelFocus.current) {
      restoreCancelFocus.current = false;
      cancelButtonRef.current?.focus();
    }
  }, [confirmingCancel]);

  const loadBooking = useCallback(
    async (signal?: AbortSignal) => {
      const response = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}`, {
        signal,
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(readApiError(payload, "Could not load this booking."));
      }
      const parsed = parseBookingDetail(payload);
      if (!parsed) throw new Error("Could not load this booking.");
      return parsed;
    },
    [bookingId],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadBooking(controller.signal)
      .then((result) => {
        setBooking(result);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof Error ? error.message : "Could not load this booking.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [loadBooking]);

  // The customer has come back from checkout but the webhook has not settled
  // the payment yet. Don't offer a second payment or a cancel in this window.
  const awaitingConfirmation =
    isReturnFromCheckout(paymentCode) &&
    booking?.status === "PENDING" &&
    booking.paymentStatus === "PENDING";

  useEffect(() => {
    if (!awaitingConfirmation) return;
    let checks = 0;
    let cancelled = false;
    const timer = window.setInterval(() => {
      checks += 1;
      loadBooking()
        .then((result) => {
          if (!cancelled) setBooking(result);
        })
        .catch(() => undefined);
      if (checks >= CONFIRMATION_MAX_CHECKS) {
        window.clearInterval(timer);
        if (!cancelled) setPollTimedOut(true);
      }
    }, CONFIRMATION_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [awaitingConfirmation, loadBooking, pollRound]);

  async function startPayment() {
    setIsBusy(true);
    setActionError(null);
    setActionMessage(null);
    try {
      const response = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          readApiError(payload, "Could not start secure checkout. Please retry."),
        );
      }
      const paymentUrl =
        isRecord(payload) &&
        isRecord(payload.data) &&
        typeof payload.data.paymentUrl === "string"
          ? payload.data.paymentUrl
          : null;
      if (!paymentUrl) {
        throw new Error("The payment service returned an unexpected response.");
      }
      const url = new URL(paymentUrl);
      if (url.protocol !== "https:") {
        throw new Error("The payment service returned an invalid checkout link.");
      }
      window.location.assign(url.toString());
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not start checkout.",
      );
      setIsBusy(false);
    }
  }

  async function cancelBooking() {
    setIsBusy(true);
    setActionError(null);
    setActionMessage(null);
    try {
      const response = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(readApiError(payload, "Could not cancel this booking."));
      }
      setConfirmingCancel(false);
      setActionMessage(readMessage(payload) ?? "Booking cancelled.");
      // Re-read so status, payment and refund state come from the server.
      setBooking(await loadBooking());
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not cancel this booking.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  const paymentNoticeResult = getPaymentNoticeForBooking(
    paymentCode,
    booking?.paymentStatus ?? null,
  );
  const paymentNotice = paymentNoticeResult?.message ?? null;
  const paymentNoticeIsProblem = paymentNoticeResult?.isProblem ?? false;

  if (isLoading) {
    return (
      <main id="main-content" className="mx-auto w-full max-w-[860px] px-4 pb-28 pt-8">
        <p className="text-muted" role="status">
          Loading booking...
        </p>
      </main>
    );
  }

  if (loadError || !booking) {
    return (
      <main id="main-content" className="mx-auto w-full max-w-[860px] px-4 pb-28 pt-8">
        <p
          className="rounded-xl bg-surface-muted p-4 text-danger"
          role="alert"
        >
          {loadError ?? "Could not load this booking."}
        </p>
        <Link className={`${secondaryButtonClassName} mt-4`} href="/trips">
          Back to trips
        </Link>
      </main>
    );
  }

  const canPay =
    !awaitingConfirmation &&
    booking.status === "PENDING" &&
    (booking.paymentStatus === "PENDING" || booking.paymentStatus === "FAILED");
  const canCancel =
    !awaitingConfirmation &&
    (booking.status === "PENDING" || booking.status === "CONFIRMED");
  const policy = booking.cancellationPolicy
    ? CANCELLATION_POLICY_DETAILS[booking.cancellationPolicy]
    : null;
  const place = [booking.hostel.area, booking.hostel.city].filter(Boolean).join(", ");

  return (
    <main id="main-content" className="mx-auto w-full max-w-[860px] px-4 pb-28 pt-8">
      <Link className="text-label font-semibold text-brand hover:underline" href="/trips">
        ← Back to trips
      </Link>
      <h1 className="mb-1 mt-3 text-display font-bold text-ink">Your booking</h1>

      <div className="mt-4">
        {paymentNotice ? (
          <AuthNotice tone={paymentNoticeIsProblem ? "error" : "success"}>
            {paymentNotice}
          </AuthNotice>
        ) : null}
        {actionMessage ? (
          <AuthNotice focusOnMount tone="success">
            {actionMessage}
          </AuthNotice>
        ) : null}
        {actionError ? <AuthNotice tone="error">{actionError}</AuthNotice> : null}
      </div>

      <section className="mt-4 grid gap-5 overflow-hidden rounded-xl border border-line bg-surface p-3 md:grid-cols-[minmax(180px,260px)_minmax(0,1fr)]">
        <div className="relative min-h-[170px] overflow-hidden rounded-[10px] bg-brand-soft">
          {booking.hostel.coverImage ? (
            <Image
              alt={booking.hostel.name}
              className="object-cover"
              fill
              sizes="(max-width: 720px) 90vw, 260px"
              src={booking.hostel.coverImage}
            />
          ) : null}
        </div>
        <div className="min-w-0 self-center py-1">
          <p className="m-0 mb-1 text-label text-muted">{place}</p>
          <h2 className="m-0 mb-2 text-title font-semibold text-ink">
            <Link className="text-inherit no-underline hover:underline" href={`/hostels/${booking.hostel.slug}`}>
              {booking.hostel.name}
            </Link>
          </h2>
          {booking.hostel.address ? (
            <p className="m-0 text-label text-muted">{booking.hostel.address}</p>
          ) : null}
        </div>
      </section>

      <section aria-label="Booking summary" className="mt-5 rounded-xl border border-line bg-surface p-5">
        <dl className="m-0 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-label text-muted">Check-in</dt>
            <dd className="m-0 font-semibold text-ink">
              {dateFormatter.format(new Date(booking.checkIn))}
            </dd>
          </div>
          <div>
            <dt className="text-label text-muted">Check-out</dt>
            <dd className="m-0 font-semibold text-ink">
              {dateFormatter.format(new Date(booking.checkOut))}
            </dd>
          </div>
          <div>
            <dt className="text-label text-muted">Duration</dt>
            <dd className="m-0 font-semibold text-ink">
              {booking.months} {booking.months === 1 ? "month" : "months"}
            </dd>
          </div>
          <div>
            <dt className="text-label text-muted">Guests</dt>
            <dd className="m-0 font-semibold text-ink">{booking.guests}</dd>
          </div>
          <div>
            <dt className="text-label text-muted">Booking status</dt>
            <dd className="m-0 mt-1">
              <StatusBadge
                status={booking.status.toLowerCase()}
                tone={bookingStatusTone[booking.status]}
              >
                {bookingStatuses[booking.status]}
              </StatusBadge>
            </dd>
          </div>
          <div>
            <dt className="text-label text-muted">Payment</dt>
            <dd className="m-0 mt-1">
              <StatusBadge
                status={booking.paymentStatus.toLowerCase()}
                tone={paymentStatusTone[booking.paymentStatus]}
              >
                {paymentStatuses[booking.paymentStatus]}
              </StatusBadge>
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-label text-muted">Total</dt>
            <dd className="m-0 text-title font-bold text-ink">
              {formatPrice(booking.total)}
            </dd>
          </div>
        </dl>
        {booking.status === "PENDING" && booking.paymentStatus === "PAID" ? (
          <p className="mb-0 mt-4 text-label text-muted">
            Your payment is received. The host still needs to confirm this
            booking
            {booking.ownerResponseDueAt
              ? ` by ${dateFormatter.format(new Date(booking.ownerResponseDueAt))}`
              : ""}
            . If they decline or don't respond, you're refunded in full.
          </p>
        ) : null}
      </section>

      {policy ? (
        <section aria-label="Cancellation terms" className="mt-5 rounded-xl border border-line bg-surface p-5">
          <h2 className="m-0 mb-2 text-body font-semibold text-ink">
            Cancellation: {policy.label}
          </h2>
          <ul className="m-0 grid gap-1 pl-5 text-label text-muted">
            <li>{policy.fullRefund}</li>
            <li>{policy.partialRefund}</li>
            <li>{policy.noRefund}</li>
          </ul>
        </section>
      ) : null}

      {booking.status === "COMPLETED" ? (
        <BookingReviewForm
          hostelId={booking.hostel.id}
          hostelName={booking.hostel.name}
        />
      ) : null}

      {awaitingConfirmation ? (
        <div className="mt-6 rounded-xl border border-line bg-surface-muted p-4" role="status">
          {pollTimedOut ? (
            <>
              <p className="m-0 font-semibold text-ink">
                Your payment is still being confirmed.
              </p>
              <p className="m-0 mt-1 text-label text-muted">
                This is taking longer than usual. Please don&apos;t pay again. If you
                were charged, the booking will update shortly.
              </p>
              <button
                className={`${secondaryButtonClassName} mt-3`}
                onClick={() => {
                  setPollTimedOut(false);
                  setPollRound((round) => round + 1);
                }}
                type="button"
              >
                Check again
              </button>
            </>
          ) : (
            <p className="m-0 font-semibold text-ink">
              Confirming your payment… this page will update automatically.
            </p>
          )}
        </div>
      ) : null}

      {canPay || canCancel ? (
        <div className="mt-6 flex flex-wrap gap-3">
          {canPay ? (
            <button
              className={primaryButtonClassName}
              disabled={isBusy}
              onClick={startPayment}
              type="button"
            >
              {isBusy && !confirmingCancel ? "Starting checkout…" : "Pay now"}
            </button>
          ) : null}
          {canCancel && !confirmingCancel ? (
            <button
              className={secondaryButtonClassName}
              disabled={isBusy}
              onClick={() => setConfirmingCancel(true)}
              ref={cancelButtonRef}
              type="button"
            >
              Cancel booking
            </button>
          ) : null}
        </div>
      ) : null}

      {confirmingCancel ? (
        <div
          aria-label="Confirm cancellation"
          className="mt-4 rounded-xl border border-line bg-surface-muted p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          ref={confirmPanelRef}
          role="alertdialog"
          tabIndex={-1}
        >
          <p className="m-0 font-semibold text-ink">Cancel this booking?</p>
          <p className="mb-3 mt-1 text-label text-muted">
            This can't be undone. Any refund follows the cancellation terms above.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              className={primaryButtonClassName}
              disabled={isBusy}
              onClick={cancelBooking}
              type="button"
            >
              {isBusy ? "Cancelling…" : "Yes, cancel booking"}
            </button>
            <button
              className={secondaryButtonClassName}
              disabled={isBusy}
              onClick={() => {
                restoreCancelFocus.current = true;
                setConfirmingCancel(false);
              }}
              type="button"
            >
              Keep booking
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
