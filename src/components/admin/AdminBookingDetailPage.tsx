"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { secondaryButtonClassName } from "@/components/owner/ListingFormFields";
import { readAdminError } from "./adminListings";
import { adminBookingStatusLabel, parseAdminBooking, type AdminBooking } from "./adminBookings";

const dateFormatter = new Intl.DateTimeFormat("en-PK", {
  dateStyle: "medium",
  timeZone: "Asia/Karachi",
});

const currencyFormatter = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export interface AdminBookingDetailContentProps {
  booking: AdminBooking | null;
  isLoading: boolean;
  loadError: string | null;
  onRetry: () => void;
}

export function AdminBookingDetailContent({
  booking,
  isLoading,
  loadError,
  onRetry,
}: AdminBookingDetailContentProps) {
  return (
    <main className="mx-auto grid w-[min(760px,calc(100%-var(--page-gutter-mobile)))] gap-5 pb-16 pt-8 md:pt-10">
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        <Link
          className="text-[0.85rem] font-semibold text-brand hover:underline"
          href="/admin/bookings"
        >
          ← Back to bookings
        </Link>
        <Link
          className="text-[0.85rem] font-semibold text-brand hover:underline"
          href="/admin"
        >
          Admin console
        </Link>
      </div>
      <h1 className="m-0 text-[clamp(1.6rem,3vw,2.1rem)] font-semibold tracking-[-0.035em] text-ink">
        Booking detail
      </h1>
      {isLoading ? (
        <p className="m-0 text-muted" role="status">
          Loading booking...
        </p>
      ) : loadError ? (
        <div className="rounded-[14px] bg-surface-muted p-4" role="alert">
          <p className="m-0 text-[#c13515]">{loadError}</p>
          <button
            className={`${secondaryButtonClassName} mt-3`}
            onClick={onRetry}
            type="button"
          >
            Try again
          </button>
        </div>
      ) : booking ? (
        <section
          aria-labelledby="admin-booking-details"
          className="grid gap-4 rounded-[14px] border border-line bg-surface p-4"
        >
          <h2
            className="m-0 text-[1.05rem] font-semibold text-ink"
            id="admin-booking-details"
          >
            {booking.hostel.name}
          </h2>
          <dl className="m-0 grid gap-3 text-[0.9rem] sm:grid-cols-2">
            <div>
              <dt className="text-muted">Booking status</dt>
              <dd className="m-0 font-semibold text-ink">
                {adminBookingStatusLabel(booking.status)}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Payment status</dt>
              <dd className="m-0 font-semibold text-ink">
                {adminBookingStatusLabel(booking.paymentStatus)}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Stay</dt>
              <dd className="m-0 text-ink">
                {dateFormatter.format(new Date(booking.checkIn))} to{" "}
                {dateFormatter.format(new Date(booking.checkOut))}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Guests</dt>
              <dd className="m-0 text-ink">{booking.guests}</dd>
            </div>
            <div>
              <dt className="text-muted">Total</dt>
              <dd className="m-0 text-ink">
                {currencyFormatter.format(booking.total)}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Room reference</dt>
              <dd className="m-0 text-ink">
                {booking.roomId ?? "No room assigned"}
              </dd>
            </div>
            {booking.hostel.city ? (
              <div>
                <dt className="text-muted">City</dt>
                <dd className="m-0 text-ink">{booking.hostel.city}</dd>
              </div>
            ) : null}
          </dl>
          <p className="m-0 text-[0.82rem] text-muted">
            No admin action is available on this screen. This endpoint does not
            expose a booking audit history.
          </p>
        </section>
      ) : (
        <p className="m-0 text-muted" role="status">
          Booking details are unavailable.
        </p>
      )}
    </main>
  );
}

export function AdminBookingDetailPage({ id }: { id: string }) {
  const [booking, setBooking] = useState<AdminBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setLoadError(null);
    fetch(`/api/bookings/${encodeURIComponent(id)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(readAdminError(payload, "Could not load this booking."));
        }
        if (
          typeof payload !== "object" ||
          payload === null ||
          !("data" in payload)
        ) {
          throw new Error("Could not load this booking.");
        }
        const parsed = parseAdminBooking(payload.data);
        if (!parsed) throw new Error("Could not load this booking.");
        setBooking(parsed);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof Error
            ? error.message
            : "Could not load this booking.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [id, retryCount]);

  return (
    <AdminBookingDetailContent
      booking={booking}
      isLoading={isLoading}
      loadError={loadError}
      onRetry={() => setRetryCount((count) => count + 1)}
    />
  );
}
