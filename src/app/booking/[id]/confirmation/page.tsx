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
import { PageSpinner, InlineError } from "@/components/ui/shared";
import { format } from "date-fns";

const POLL_INTERVAL = 4_000; // 4s
const MAX_POLLS     = 15;    // give up after ~60s

export default function ConfirmationPage() {
  const params    = useParams<{ id: string }>();
  const router    = useRouter();
  const bookingId = params.id;

  const [booking,  setBooking]  = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [fetchErr, setFetchErr] = useState("");
  const [polls,    setPolls]    = useState(0);

  /* ── Poll booking status until PAID/CONFIRMED ───────── */
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

  /* ── Render states ──────────────────────────────────── */
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

  /* ── Cancelled ──────────────────────────────────────── */
  if (isCancelled) {
    return (
      <BookingStepLayout step={3}>
        <div className="text-center py-10 space-y-4">
          <div className="flex justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-error-bg)]">
              <Clock
                size={32}
                strokeWidth={1.5}
                className="text-[var(--color-error)]"
                aria-hidden="true"
              />
            </span>
          </div>
          <h1
            className="text-[var(--text-h3)] font-[700] text-[var(--color-text-heading)]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Booking cancelled
          </h1>
          <p className="text-[var(--text-body)] text-[var(--color-text-muted)] max-w-[38ch] mx-auto">
            This booking was cancelled. Any payment will be refunded within 5–7
            business days.
          </p>
          <Link
            href="/hostels"
            className="inline-flex h-10 items-center px-5 rounded-[var(--radius-md)] bg-[var(--color-action)] text-[var(--text-body-sm)] font-[500] text-[var(--color-text-inverse)] hover:bg-[var(--color-action-dark)] transition-colors duration-[var(--transition-base)]"
          >
            Find another hostel
          </Link>
        </div>
      </BookingStepLayout>
    );
  }

  /* ── Still polling — payment webhook not yet received ─ */
  if (stillWaiting) {
    return (
      <BookingStepLayout step={3}>
        <div className="text-center py-10 space-y-4">
          <Loader2
            size={36}
            strokeWidth={1.5}
            className="animate-spin text-[var(--color-primary)] mx-auto"
            aria-hidden="true"
          />
          <h1
            className="text-[var(--text-h3)] font-[700] text-[var(--color-text-heading)]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Confirming your payment…
          </h1>
          <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
            This usually takes a few seconds. Please don't close this page.
          </p>
          <BookingSummaryCard booking={booking} />
        </div>
      </BookingStepLayout>
    );
  }

  /* ── Timed out without confirmation ─────────────────── */
  if (!isSuccess) {
    return (
      <BookingStepLayout step={3}>
        <div className="space-y-5">
          <div className="text-center space-y-3">
            <Clock
              size={40}
              strokeWidth={1.5}
              className="text-[var(--color-warning)] mx-auto"
              aria-hidden="true"
            />
            <h1
              className="text-[var(--text-h3)] font-[700] text-[var(--color-text-heading)]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Payment pending
            </h1>
            <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)] max-w-[40ch] mx-auto">
              Your payment is being processed. Check your bookings page for the
              latest status — it usually updates within a minute.
            </p>
          </div>
          <BookingSummaryCard booking={booking} />
          <Link
            href="/dashboard/bookings"
            className="inline-flex w-full h-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-action)] text-[var(--text-body-sm)] font-[500] text-[var(--color-text-inverse)] hover:bg-[var(--color-action-dark)] transition-colors duration-[var(--transition-base)]"
          >
            View my bookings
          </Link>
        </div>
      </BookingStepLayout>
    );
  }

  /* ── Success ─────────────────────────────────────────── */
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
                className="text-[var(--color-action)]"
                aria-hidden="true"
              />
            </span>
          </div>

          <div>
            <h1
              className="text-[var(--text-h2)] font-[700] text-[var(--color-text-heading)] mb-2"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Booking confirmed
            </h1>
            <p className="text-[var(--text-body)] text-[var(--color-text-muted)]">
              Your booking request has been sent to the owner.
            </p>
          </div>

          {/* Booking reference */}
          <div className="inline-flex flex-col items-center gap-1">
            <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">
              Booking reference
            </p>
            <code className="ref-id text-[var(--text-body-sm)]">
              {bookingId.slice(0, 12).toUpperCase()}
            </code>
          </div>
        </div>

        {/* Booking summary */}
        <BookingSummaryCard booking={booking} showStatus />

        {/* What happens next */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-sidebar)] p-5">
          <h2
            className="text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)] mb-4"
            style={{ fontFamily: "var(--font-body)" }}
          >
            What happens next
          </h2>
          <ol className="space-y-4" role="list">
            {[
              {
                icon: Clock,
                text: "The owner will confirm your booking within 24 hours.",
              },
              {
                icon: CalendarCheck,
                text: `Your check-in date is ${checkInFmt}. The owner will contact you with check-in instructions.`,
              },
              {
                icon: CheckCircle2,
                text: "After your stay, you'll be able to leave a review to help other students.",
              },
            ].map(({ icon: Icon, text }, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--text-caption)] font-[700] text-[var(--color-primary-deep)]">
                  {i + 1}
                </span>
                <p className="text-[var(--text-body-sm)] text-[var(--color-text-body)] leading-relaxed">
                  {text}
                </p>
              </li>
            ))}
          </ol>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/dashboard/bookings"
            className="inline-flex flex-1 items-center justify-center h-11 rounded-[var(--radius-md)] bg-[var(--color-action)] text-[var(--text-body-sm)] font-[500] text-[var(--color-text-inverse)] hover:bg-[var(--color-action-dark)] active:scale-[0.97] transition-all duration-[var(--transition-base)] focus-visible:outline-2 focus-visible:outline-[var(--color-action-light)] focus-visible:outline-offset-2"
          >
            View booking
          </Link>
          <MessageOwnerButton bookingId={bookingId} hostelId={booking.hostelId} />
        </div>
      </div>
    </BookingStepLayout>
  );
}

/* ── Message owner button — inline client action ─────── */
function MessageOwnerButton({
  bookingId,
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
    <button
      onClick={handleMessage}
      disabled={busy}
      className="inline-flex flex-1 items-center justify-center gap-2 h-11 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] text-[var(--text-body-sm)] font-[500] text-[var(--color-text-body)] hover:bg-[var(--color-bg-overlay)] hover:border-[var(--color-border-strong)] active:scale-[0.97] transition-all duration-[var(--transition-base)] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2"
    >
      {busy ? (
        <Loader2 size={15} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
      ) : (
        <MessageCircle size={15} strokeWidth={1.5} aria-hidden="true" />
      )}
      Message owner
    </button>
  );
}