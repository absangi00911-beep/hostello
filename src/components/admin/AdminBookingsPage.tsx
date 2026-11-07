"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { secondaryButtonClassName } from "@/components/owner/ListingFormFields";
import { readAdminError } from "./adminListings";
import {
  ADMIN_BOOKING_STATUSES,
  adminBookingStatusLabel,
  isCurrentAdminBookingsRequest,
  parseAdminBookingsPage,
  settleAdminBookingsPaginationRequest,
  type AdminBooking,
  type AdminBookingStatusFilter,
} from "./adminBookings";

const PAGE_SIZE = 25;

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

const STATUS_TABS: ReadonlyArray<{
  value: AdminBookingStatusFilter;
  label: string;
}> = [
  { value: "ALL", label: "All" },
  ...ADMIN_BOOKING_STATUSES.map((value) => ({
    value,
    label: adminBookingStatusLabel(value),
  })),
];

export interface AdminBookingsContentProps {
  status: AdminBookingStatusFilter;
  bookings: AdminBooking[];
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  loadError: string | null;
  moreError: string | null;
  onStatusChange: (status: AdminBookingStatusFilter) => void;
  onRetry: () => void;
  onLoadMore: () => void;
}

function BookingCard({ booking }: { booking: AdminBooking }) {
  return (
    <li className="grid gap-3 rounded-[14px] border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="m-0 text-[1rem] font-semibold text-ink">
          {booking.hostel.name}
        </h2>
        <span className="rounded-full bg-surface-muted px-[10px] py-[2px] text-[0.72rem] font-bold text-ink">
          {adminBookingStatusLabel(booking.status)}
        </span>
      </div>
      <dl className="m-0 grid gap-2 text-[0.85rem] sm:grid-cols-2">
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
          <dd className="m-0 text-ink">{currencyFormatter.format(booking.total)}</dd>
        </div>
      </dl>
      <Link
        className="w-fit text-[0.85rem] font-semibold text-brand hover:underline"
        href={`/admin/bookings/${encodeURIComponent(booking.id)}`}
      >
        View booking
      </Link>
    </li>
  );
}

export function AdminBookingsContent({
  status,
  bookings,
  hasMore,
  isLoading,
  isLoadingMore,
  loadError,
  moreError,
  onStatusChange,
  onRetry,
  onLoadMore,
}: AdminBookingsContentProps) {
  return (
    <main className="mx-auto grid w-[min(900px,calc(100%-var(--page-gutter-mobile)))] gap-5 pb-16 pt-8 md:pt-10">
      <Link
        className="text-[0.85rem] font-semibold text-brand hover:underline"
        href="/admin"
      >
        ← Back to admin console
      </Link>
      <header>
        <h1 className="m-0 text-[clamp(1.6rem,3vw,2.1rem)] font-semibold tracking-[-0.035em] text-ink">
          Bookings
        </h1>
        <p className="mb-0 mt-2 text-[0.95rem] text-muted">
          Review booking and payment status. Student contact and provider
          identifiers are not shown here.
        </p>
      </header>

      <nav aria-label="Filter bookings" className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            aria-pressed={status === tab.value}
            className={`${secondaryButtonClassName} ${status === tab.value ? "bg-brand-soft text-brand-dark" : ""}`}
            key={tab.value}
            onClick={() => onStatusChange(tab.value)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {isLoading ? (
        <p className="m-0 text-muted" role="status">
          Loading bookings...
        </p>
      ) : loadError ? (
        <div className="rounded-[14px] bg-surface-muted p-4" role="alert">
          <p className="m-0 text-danger">{loadError}</p>
          <button
            className={`${secondaryButtonClassName} mt-3`}
            onClick={onRetry}
            type="button"
          >
            Try again
          </button>
        </div>
      ) : bookings.length === 0 ? (
        <p className="m-0 text-[0.92rem] text-muted">
          No bookings to review.
        </p>
      ) : (
        <>
          <p aria-live="polite" className="m-0 text-[0.85rem] text-muted">
            {bookings.length} {bookings.length === 1 ? "booking" : "bookings"}{" "}
            shown
          </p>
          <ul className="m-0 grid list-none gap-3 p-0">
            {bookings.map((booking) => (
              <BookingCard booking={booking} key={booking.id} />
            ))}
          </ul>
        </>
      )}

      {moreError ? (
        <p className="m-0 text-[0.875rem] text-danger" role="alert">
          {moreError}
        </p>
      ) : null}
      {hasMore ? (
        <button
          className={secondaryButtonClassName}
          disabled={isLoadingMore}
          onClick={onLoadMore}
          type="button"
        >
          {isLoadingMore ? "Loading…" : "Load more bookings"}
        </button>
      ) : null}
    </main>
  );
}

async function fetchBookings(
  status: AdminBookingStatusFilter,
  page: number,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
  });
  if (status !== "ALL") params.set("status", status);
  const response = await fetch(`/api/bookings?${params.toString()}`, { signal });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(readAdminError(payload, "Could not load bookings."));
  }
  const parsed = parseAdminBookingsPage(payload);
  if (!parsed) throw new Error("Could not load bookings.");
  return parsed;
}

export function AdminBookingsPage() {
  const [status, setStatus] = useState<AdminBookingStatusFilter>("ALL");
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [moreError, setMoreError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const activeStatusRef = useRef(status);
  const activeRequestGenerationRef = useRef(0);

  const handleStatusChange = useCallback((nextStatus: AdminBookingStatusFilter) => {
    if (nextStatus !== activeStatusRef.current) {
      activeStatusRef.current = nextStatus;
      activeRequestGenerationRef.current += 1;
      setIsLoadingMore(false);
    }
    setStatus(nextStatus);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setLoadError(null);
    setMoreError(null);
    fetchBookings(status, 1, controller.signal)
      .then((result) => {
        setBookings(result.data);
        setPage(result.page);
        setHasMore(result.hasMore);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof Error ? error.message : "Could not load bookings.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [retryCount, status]);

  const loadMore = useCallback(async () => {
    setIsLoadingMore(true);
    setMoreError(null);
    const requestGeneration = activeRequestGenerationRef.current;
    const isCurrent = () =>
      isCurrentAdminBookingsRequest(
        status,
        activeStatusRef.current,
        requestGeneration,
        activeRequestGenerationRef.current,
      );
    await settleAdminBookingsPaginationRequest(
      fetchBookings(status, page + 1),
      isCurrent,
      {
        onSuccess: (result) => {
          setBookings((current) => {
            const seen = new Set(current.map((booking) => booking.id));
            return [
              ...current,
              ...result.data.filter((booking) => !seen.has(booking.id)),
            ];
          });
          setPage(result.page);
          setHasMore(result.hasMore);
        },
        onError: (error) => {
          setMoreError(
            error instanceof Error
              ? error.message
              : "Could not load more bookings.",
          );
        },
        onFinally: () => setIsLoadingMore(false),
      },
    );
  }, [page, status]);

  return (
    <AdminBookingsContent
      bookings={bookings}
      hasMore={hasMore}
      isLoading={isLoading}
      isLoadingMore={isLoadingMore}
      loadError={loadError}
      moreError={moreError}
      onLoadMore={() => void loadMore()}
      onRetry={() => setRetryCount((count) => count + 1)}
      onStatusChange={handleStatusChange}
      status={status}
    />
  );
}
