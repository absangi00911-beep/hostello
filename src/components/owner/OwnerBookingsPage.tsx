"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  BOOKING_FILTERS,
  getResponseState,
  parseBookingsPage,
  readActionMessage,
  readBookingsError,
  type BookingStatus,
  type BookingStatusFilter,
  type OwnerBooking,
} from "./ownerBookings";
import {
  primaryButtonClassName,
  secondaryButtonClassName,
} from "./ListingFormFields";

const PAGE_SIZE = 20;

const currencyFormatter = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-PK", {
  dateStyle: "medium",
  timeZone: "Asia/Karachi",
});

const statusLabel: Record<BookingStatus, string> = {
  PENDING: "Needs response",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const statusBadgeClassName: Record<BookingStatus, string> = {
  PENDING: "bg-[#fbf4e6] text-[#583c13]",
  CONFIRMED: "bg-brand-soft text-brand-dark",
  COMPLETED: "bg-surface-muted text-muted",
  CANCELLED: "bg-[#f9e4e0] text-[#8c2822]",
};

export interface BookingNotice {
  tone: "success" | "error";
  text: string;
}

interface BookingCardProps {
  booking: OwnerBooking;
  now: number;
  busy: boolean;
  declining: boolean;
  onConfirm: (id: string) => void;
  onAskDecline: (id: string) => void;
  onCancelDecline: () => void;
  onDecline: (id: string) => void;
}

function BookingCard({
  booking,
  now,
  busy,
  declining,
  onConfirm,
  onAskDecline,
  onCancelDecline,
  onDecline,
}: BookingCardProps) {
  const response = getResponseState(booking, now);
  const { student } = booking;

  return (
    <li className="grid gap-3 rounded-[14px] border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="m-0 min-w-0 text-[1rem] font-semibold text-ink">
          {student.name}
        </h3>
        <span
          className={`rounded-full px-[10px] py-[2px] text-[0.72rem] font-bold ${statusBadgeClassName[booking.status]}`}
        >
          {statusLabel[booking.status]}
        </span>
      </div>

      <p className="m-0 text-[0.88rem] text-ink">
        {booking.hostel.name} · {dateFormatter.format(new Date(booking.checkIn))} to{" "}
        {dateFormatter.format(new Date(booking.checkOut))}
      </p>
      <p className="m-0 text-[0.85rem] text-muted">
        {booking.months} {booking.months === 1 ? "month" : "months"} ·{" "}
        {booking.guests} {booking.guests === 1 ? "guest" : "guests"} ·{" "}
        {currencyFormatter.format(booking.total)} paid
      </p>
      <p className="m-0 flex flex-wrap gap-x-4 text-[0.85rem]">
        {student.email ? (
          <a
            className="font-semibold text-brand hover:underline"
            href={`mailto:${student.email}`}
          >
            {student.email}
          </a>
        ) : null}
        {student.phone ? (
          <a
            className="font-semibold text-brand hover:underline"
            href={`tel:${student.phone}`}
          >
            {student.phone}
          </a>
        ) : null}
      </p>

      {response.kind === "open" ? (
        <p
          className={`m-0 text-[0.85rem] font-semibold ${
            response.urgent ? "text-[#c13515]" : "text-[#583c13]"
          }`}
        >
          {response.label}
        </p>
      ) : null}
      {response.kind === "expired" ? (
        <p className="m-0 text-[0.85rem] text-muted">
          The 24-hour response window has ended. This request is being
          cancelled and the student refunded in full.
        </p>
      ) : null}

      {response.kind === "open" ? (
        declining ? (
          <div
            className="grid gap-3 rounded-[12px] bg-surface-muted p-3"
            role="group"
            aria-label={`Confirm declining ${student.name}'s request`}
          >
            <p className="m-0 text-[0.88rem] text-ink">
              Decline this request? {student.name} will be refunded{" "}
              {currencyFormatter.format(booking.total)} in full.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                className={secondaryButtonClassName}
                disabled={busy}
                onClick={() => onDecline(booking.id)}
                type="button"
              >
                {busy ? "Declining…" : "Yes, decline and refund"}
              </button>
              <button
                className={secondaryButtonClassName}
                disabled={busy}
                onClick={onCancelDecline}
                type="button"
              >
                Keep request
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              className={`${primaryButtonClassName} min-h-11! px-4! text-[0.85rem]!`}
              disabled={busy}
              onClick={() => onConfirm(booking.id)}
              type="button"
            >
              {busy ? "Confirming…" : "Confirm booking"}
            </button>
            <button
              className={secondaryButtonClassName}
              disabled={busy}
              onClick={() => onAskDecline(booking.id)}
              type="button"
            >
              Decline
            </button>
          </div>
        )
      ) : null}
    </li>
  );
}

export interface OwnerBookingsContentProps {
  filter: BookingStatusFilter;
  items: OwnerBooking[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  loadError: string | null;
  moreError: string | null;
  notice: BookingNotice | null;
  now: number;
  busyId: string | null;
  decliningId: string | null;
  onFilterChange: (filter: BookingStatusFilter) => void;
  onLoadMore: () => void;
  onRetry: () => void;
  onConfirm: (id: string) => void;
  onAskDecline: (id: string) => void;
  onCancelDecline: () => void;
  onDecline: (id: string) => void;
}

export function OwnerBookingsContent({
  filter,
  items,
  total,
  hasMore,
  isLoading,
  isLoadingMore,
  loadError,
  moreError,
  notice,
  now,
  busyId,
  decliningId,
  onFilterChange,
  onLoadMore,
  onRetry,
  onConfirm,
  onAskDecline,
  onCancelDecline,
  onDecline,
}: OwnerBookingsContentProps) {
  return (
    <main className="mx-auto w-[min(860px,calc(100%-var(--page-gutter-mobile)))] pb-16 pt-8 md:pt-10">
      <Link
        className="text-[0.85rem] font-semibold text-brand hover:underline"
        href="/owner"
      >
        ← Back to dashboard
      </Link>
      <h1 className="mb-0 mt-3 text-[clamp(1.6rem,3vw,2.1rem)] font-semibold tracking-[-0.035em] text-ink">
        Bookings
      </h1>
      <p className="mb-6 mt-2 text-[0.95rem] text-muted">
        Paid requests for your hostels. Respond within 24 hours or the request
        is cancelled and the student is refunded.
      </p>

      <div
        aria-label="Filter bookings by status"
        className="mb-5 flex flex-wrap gap-2"
        role="group"
      >
        {BOOKING_FILTERS.map(({ value, label }) => (
          <button
            aria-pressed={filter === value}
            className="cursor-pointer rounded-full border border-line bg-white px-4 py-[7px] text-[0.82rem] font-semibold text-ink hover:bg-surface-muted aria-pressed:border-brand aria-pressed:bg-brand-soft aria-pressed:text-brand-dark focus-visible:outline-2! focus-visible:outline-brand! btn-secondary"
            key={value}
            onClick={() => onFilterChange(value)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {notice ? (
        <p
          className={`mb-4 rounded-[14px] px-[13px] py-[11px] text-[0.875rem] ${
            notice.tone === "error"
              ? "bg-surface-muted text-[#c13515]"
              : "bg-brand-soft text-brand-dark"
          }`}
          role={notice.tone === "error" ? "alert" : "status"}
        >
          {notice.text}
        </p>
      ) : null}

      <p aria-live="polite" className="mb-3 mt-0 text-[0.85rem] text-muted">
        {isLoading || loadError
          ? ""
          : `${total} ${total === 1 ? "booking" : "bookings"}`}
      </p>

      {isLoading ? (
        <p className="text-muted" role="status">
          Loading bookings...
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
      ) : items.length === 0 ? (
        <p className="rounded-[14px] border border-line bg-surface p-6 text-center text-muted">
          {filter === "PENDING"
            ? "No booking requests are waiting for you."
            : filter === "ALL"
              ? "You don't have any paid bookings yet."
              : `No ${BOOKING_FILTERS.find((f) => f.value === filter)?.label.toLowerCase()} bookings.`}
        </p>
      ) : (
        <ul className="m-0 grid list-none gap-3 p-0">
          {items.map((booking) => (
            <BookingCard
              booking={booking}
              busy={busyId === booking.id}
              declining={decliningId === booking.id}
              key={booking.id}
              now={now}
              onAskDecline={onAskDecline}
              onCancelDecline={onCancelDecline}
              onConfirm={onConfirm}
              onDecline={onDecline}
            />
          ))}
        </ul>
      )}

      {moreError ? (
        <p
          className="mt-4 rounded-[14px] bg-surface-muted px-[13px] py-[11px] text-[0.875rem] text-[#c13515]"
          role="alert"
        >
          {moreError}
        </p>
      ) : null}

      {hasMore && !isLoading && !loadError ? (
        <div className="mt-5 text-center">
          <button
            className={secondaryButtonClassName}
            disabled={isLoadingMore}
            onClick={onLoadMore}
            type="button"
          >
            {isLoadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      ) : null}
    </main>
  );
}

async function fetchBookings(
  filter: BookingStatusFilter,
  page: number,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
  });
  if (filter !== "ALL") params.set("status", filter);
  const response = await fetch(`/api/bookings?${params.toString()}`, { signal });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(readBookingsError(payload, "Could not load your bookings."));
  }
  const parsed = parseBookingsPage(payload);
  if (!parsed) throw new Error("Could not load your bookings.");
  return parsed;
}

export function OwnerBookingsPage() {
  const [filter, setFilter] = useState<BookingStatusFilter>("PENDING");
  const [items, setItems] = useState<OwnerBooking[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [moreError, setMoreError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [notice, setNotice] = useState<BookingNotice | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Keep the response countdowns fresh without re-fetching.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const loadFirstPage = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setLoadError(null);
    setMoreError(null);
    setItems([]);
    try {
      const result = await fetchBookings(filter, 1, signal);
      if (signal?.aborted) return;
      setItems(result.data);
      setTotal(result.total);
      setPage(result.page);
      setHasMore(result.hasMore);
      setNow(Date.now());
    } catch (error: unknown) {
      if (signal?.aborted) return;
      setLoadError(
        error instanceof Error ? error.message : "Could not load your bookings.",
      );
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    const controller = new AbortController();
    void loadFirstPage(controller.signal);
    return () => controller.abort();
  }, [filter, retryCount, loadFirstPage]);

  const loadMore = useCallback(async () => {
    setIsLoadingMore(true);
    setMoreError(null);
    try {
      const result = await fetchBookings(filter, page + 1);
      setItems((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...result.data.filter((item) => !seen.has(item.id))];
      });
      setTotal(result.total);
      setPage(result.page);
      setHasMore(result.hasMore);
    } catch (error) {
      setMoreError(
        error instanceof Error ? error.message : "Could not load more bookings.",
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [filter, page]);

  const respond = useCallback(
    async (id: string, action: "confirm" | "decline") => {
      setNotice(null);
      setBusyId(id);
      try {
        const response = await fetch(`/api/bookings/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        const payload: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          const needsRefresh = response.status === 409 || response.status >= 500;
          setNotice({
            tone: "error",
            text: needsRefresh && response.status >= 500
              ? "We couldn't confirm the booking decision. Refreshing its current status."
              : readBookingsError(payload, "We couldn't update this booking. Please try again."),
          });
          if (needsRefresh) {
            await loadFirstPage();
          }
          return;
        }
        setNotice({
          tone: "success",
          text: readActionMessage(
            payload,
            action === "confirm" ? "Booking confirmed." : "Booking declined.",
          ),
        });
        setDecliningId(null);
        const nextStatus: BookingStatus =
          action === "confirm" ? "CONFIRMED" : "CANCELLED";
        setItems((current) =>
          filter === "ALL"
            ? current.map((item) =>
                item.id === id ? { ...item, status: nextStatus } : item,
              )
            : current.filter((item) => item.id !== id),
        );
        if (filter !== "ALL") setTotal((count) => Math.max(0, count - 1));
      } catch {
        setNotice({
          tone: "error",
          text: "We couldn't confirm the booking decision. Refreshing its current status.",
        });
        await loadFirstPage();
      } finally {
        setBusyId(null);
      }
    },
    [filter, loadFirstPage],
  );

  return (
    <OwnerBookingsContent
      busyId={busyId}
      decliningId={decliningId}
      filter={filter}
      hasMore={hasMore}
      isLoading={isLoading}
      isLoadingMore={isLoadingMore}
      items={items}
      loadError={loadError}
      moreError={moreError}
      notice={notice}
      now={now}
      onAskDecline={setDecliningId}
      onCancelDecline={() => setDecliningId(null)}
      onConfirm={(id) => void respond(id, "confirm")}
      onDecline={(id) => void respond(id, "decline")}
      onFilterChange={(next) => {
        setNotice(null);
        setDecliningId(null);
        setFilter(next);
      }}
      onLoadMore={() => void loadMore()}
      onRetry={() => setRetryCount((count) => count + 1)}
      total={total}
    />
  );
}
