// Path: src/app/booking/[id]/confirmation/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  MessageCircle,
  CalendarCheck,
  Loader2,
} from "lucide-react";
import { BookingStepLayout } from "@/components/booking/BookingStepLayout";
import { BookingSummaryCard } from "@/components/booking/BookingSummaryCard";
import { PageSpinner, InlineError, RecoveryNotice } from "@/components/ui/shared";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { CANCELLATION_POLICY_DETAILS, cancellationPolicySummary, type CancellationPolicy } from "@/lib/cancellation-policy";

const POLL_INTERVAL = 4_000; // 4s
const MAX_POLLS     = 15;    // give up after ~60s

export default function ConfirmationPage() {
  const params    = useParams<{ id: string }>();
  const bookingId = params.id;

  const [booking,  setBooking]  = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [fetchErr, setFetchErr] = useState("");
  const [polls,    setPolls]    = useState(0);

  /* -- Poll booking status until PAID/CONFIRMED --------- */
  useEffect(() => {
    let timer: NodeJS.Timeout;

    async function fetchBooking() {
      try {
        const res  = await fetch(`/api/bookings/${bookingId}`, { cache: "no-store" });
        const json = await res.json();

        if (!res.ok) {
          setFetchErr(json.error ?? "Could not load booking.");
          setLoading(false);
          return;
        }

        const b = json.data;
        setBooking(b);
        setLoading(false);

        // Keep polling if still pending payment, up to MAX_POLLS
        const stillPending =
          b.paymentStatus === "PENDING" && b.status === "PENDING";

        if (stillPending) {
          setPolls((n) => {
            if (n < MAX_POLLS) {
              timer = setTimeout(fetchBooking, POLL_INTERVAL);
            }
            return n + 1;
          });
        }
      } catch {
        setFetchErr("Something went wrong loading your booking.");
        setLoading(false);
      }
    }

    fetchBooking();
    return () => clearTimeout(timer);
  }, [bookingId]);

  /* -- Render states ------------------------------------ */
  if (loading) {
    return (
      <BookingStepLayout step={3}>
        <PageSpinner label="Confirming your booking…" />
      </BookingStepLayout>
    );
  }

  if (fetchErr) {
    return (
      <BookingStepLayout step={3}>
        <InlineError message={fetchErr} />
      </BookingStepLayout>
    );
  }

  const isPaid      = booking.paymentStatus === "PAID";
  const isConfirmed = booking.status === "CONFIRMED";
  const isSuccess   = isPaid || isConfirmed;
  const isCancelled = booking.status === "CANCELLED";
  const stillWaiting = !isSuccess && !isCancelled && polls < MAX_POLLS;
  const responseDueAt = booking.ownerResponseDueAt
    ? new Intl.DateTimeFormat("en-PK", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Karachi",
      }).format(new Date(booking.ownerResponseDueAt))
    : null;

  /* -- Cancelled ---------------------------------------- */
  if (isCancelled) {
    return (
      <BookingStepLayout step={3}>
        <div className="text-center py-10 space-y-4">
          <div className="flex justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-error-bg)]">
              <Clock
                size={32}
                strokeWidth={1.5}
                className="text-[color:var(--color-error)]"
                aria-hidden="true"
              />
            </span>
          </div>
          <h1
            className="font-heading text-[length:var(--text-h3)] font-[700] text-[color:var(--color-text-heading)]"

          >
            Booking cancelled
          </h1>
          <p className="text-[length:var(--text-body)] text-[color:var(--color-text-muted)] max-w-[38ch] mx-auto">
            {booking.cancellationRefundAmount === 0 && booking.paymentStatus !== "PENDING"
              ? `This booking was cancelled. The ${booking.cancellationPolicy ? CANCELLATION_POLICY_DETAILS[booking.cancellationPolicy as CancellationPolicy].label : "saved"} policy provides no refund at this time.`
              : booking.paymentStatus === "REFUNDED"
              ? `This booking was cancelled and your full refund of PKR ${Number(booking.refundedAmount ?? booking.total).toLocaleString("en-PK")} has been processed. Your bank may take 3–10 business days to post it.`
              : booking.paymentStatus === "PARTIALLY_REFUNDED"
                ? `This booking was cancelled and a partial refund of PKR ${Number(booking.refundedAmount ?? 0).toLocaleString("en-PK")} has been processed. Your bank may take 3–10 business days to post it.`
              : booking.paymentStatus === "PAID"
                ? `This booking was cancelled. Your refund of PKR ${Number(booking.cancellationRefundAmount ?? booking.total).toLocaleString("en-PK")} is being checked; see the booking page for its latest status or contact support.`
                : "This booking was cancelled before a payment was recorded."}
          </p>
          <Button asChild variant="outline">
            <Link href="/dashboard/bookings">View my bookings</Link>
          </Button>
          {booking.cancellationPolicy && (
            <div className="mx-auto max-w-lg rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-sidebar)] p-4 text-left">
              <p className="text-[length:var(--text-body-sm)] font-[600] text-[color:var(--color-text-heading)]">
                {CANCELLATION_POLICY_DETAILS[booking.cancellationPolicy as CancellationPolicy].label} cancellation policy
              </p>
              <p className="mt-1 text-[length:var(--text-caption)] leading-relaxed text-[color:var(--color-text-muted)]">
                {cancellationPolicySummary(booking.cancellationPolicy as CancellationPolicy)}
              </p>
            </div>
          )}
          <Button asChild>
            <Link href="/hostels">Find another hostel</Link>
          </Button>
        </div>
      </BookingStepLayout>
    );
  }

  /* -- Still polling — payment webhook not yet received - */
  if (stillWaiting) {
    return (
      <BookingStepLayout step={3}>
        <div className="text-center py-10 space-y-4">
          <Loader2
            size={36}
            strokeWidth={1.5}
            className="animate-spin text-[color:var(--color-primary)] mx-auto"
            aria-hidden="true"
          />
          <h1
            className="font-heading text-[length:var(--text-h3)] font-[700] text-[color:var(--color-text-heading)]"

          >
            Confirming your payment…
          </h1>
          <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">
            This usually takes a few seconds. Please don't close this page.
          </p>
          <BookingSummaryCard booking={booking} />
        </div>
      </BookingStepLayout>
    );
  }

  /* -- Timed out without confirmation ------------------- */
  if (!isSuccess) {
    return (
      <BookingStepLayout step={3}>
        <div className="space-y-5">
          <RecoveryNotice
            tone="warning"
            title="Payment pending"
            message="Your payment is still being verified. Check your bookings page for the latest status; it usually updates within a minute."
            primaryAction={
              <Button asChild>
                <Link href="/dashboard/bookings">View my bookings</Link>
              </Button>
            }
          />
          <BookingSummaryCard booking={booking} showPaymentHint />
        </div>
      </BookingStepLayout>
    );
  }

  /* -- Success ------------------------------------------- */
  const checkInFmt = format(new Date(booking.checkIn), "d MMMM yyyy");

  return (
    <BookingStepLayout step={3}>
      <div className="space-y-8">
        {/* Hero checkmark */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-action-light)]">
              <CheckCircle2
                size={48}
                strokeWidth={1.5}
                className="text-[color:var(--color-action)]"
                aria-hidden="true"
              />
            </span>
          </div>

          <div>
            <h1
              className="font-heading text-[length:var(--text-h2)] font-[700] text-[color:var(--color-text-heading)] mb-2"

            >
              {isConfirmed ? "Booking confirmed" : "Payment received"}
            </h1>
            <p className="text-[length:var(--text-body)] text-[color:var(--color-text-muted)]">
              {isConfirmed
                ? "Your stay is confirmed. The owner will contact you with move-in details."
                : "Your booking request has been sent to the owner. Your stay is confirmed after they accept it."}
            </p>
            {!isConfirmed && responseDueAt && (
              <p className="mt-2 text-[length:var(--text-body-sm)] font-[600] text-[color:var(--color-primary-deep)]">
                Owner response due by {responseDueAt} PKT
              </p>
            )}
          </div>

          {/* Booking reference */}
          <div className="inline-flex flex-col items-center gap-1">
            <p className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
              Booking reference
            </p>
            <code className="ref-id text-[length:var(--text-body-sm)]">
              {bookingId.slice(0, 12).toUpperCase()}
            </code>
          </div>
        </div>

        {/* Booking summary */}
        <BookingSummaryCard booking={booking} showStatus />
        {booking.cancellationPolicy && (
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-sidebar)] p-5">
            <h2 className="text-[length:var(--text-body-sm)] font-[600] text-[color:var(--color-text-heading)]">
              {CANCELLATION_POLICY_DETAILS[booking.cancellationPolicy as CancellationPolicy].label} cancellation policy
            </h2>
            <p className="mt-2 text-[length:var(--text-body-sm)] leading-relaxed text-[color:var(--color-text-muted)]">
              {cancellationPolicySummary(booking.cancellationPolicy as CancellationPolicy)}
            </p>
            <p className="mt-2 text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
              Approved refunds are initiated within 1 business day. Banks may take 3–10 business days to post them.
            </p>
          </div>
        )}

        {/* What happens next */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-sidebar)] p-5">
          <h2
            className="text-[length:var(--text-body-sm)] font-[600] text-[color:var(--color-text-heading)] mb-4"

          >
            What happens next
          </h2>
          <ol className="space-y-4" role="list">
            {[
              {
                icon: Clock,
                text: isConfirmed
                  ? "Your booking is confirmed. Keep this reference for check-in."
                  : responseDueAt
                    ? `The owner will respond by ${responseDueAt} PKT. If they do not respond, the request will be cancelled and a full refund will be started.`
                    : "The owner will respond within 24 hours. If they do not respond, the request will be cancelled and a full refund will be started.",
              },
              {
                icon: CalendarCheck,
                text: `Your check-in date is ${checkInFmt}. The owner will contact you with check-in instructions.`,
              },
              {
                icon: CheckCircle2,
                text: "After your stay, you'll be able to leave a review to help other students.",
              },
            ].map(({ icon: _Icon, text }, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[length:var(--text-caption)] font-[700] text-[color:var(--color-primary-deep)]">
                  {i + 1}
                </span>
                <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-body)] leading-relaxed">
                  {text}
                </p>
              </li>
            ))}
          </ol>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild className="flex-1">
            <Link href="/dashboard/bookings">View booking</Link>
          </Button>
          <MessageOwnerButton bookingId={bookingId} hostelId={booking.hostelId} />
        </div>
      </div>
    </BookingStepLayout>
  );
}

/* -- Message owner button — inline client action ------- */
function MessageOwnerButton({
  bookingId: _bookingId,
  hostelId,
}: {
  bookingId: string;
  hostelId: string;
}) {
  const router  = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleMessage() {
    setBusy(true);
    try {
      const res  = await fetch("/api/conversations", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          hostelId,
          initialMessage: "Hi, I've just booked a room. Looking forward to my stay!",
        }),
      });
      const json = await res.json();
      if (res.ok) {
        router.push(`/dashboard/messages?conversation=${json.data.id}`);
      }
    } catch {
      /* silent */
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      onClick={handleMessage}
      loading={busy}
      variant="outline"
      className="flex-1"
    >
      {!busy && <MessageCircle size={15} strokeWidth={1.5} aria-hidden="true" />}
      Message owner
    </Button>
  );
}
