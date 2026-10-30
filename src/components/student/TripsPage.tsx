"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { hostelCardImageClassName } from "@/components/hostel-card-styles";

const bookingStatuses = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
} as const;

type BookingStatus = keyof typeof bookingStatuses;

interface StudentBooking {
  id: string;
  checkIn: string;
  checkOut: string;
  status: BookingStatus;
  hostel: {
    name: string;
    slug: string;
    coverImage: string | null;
    city: string;
  };
}

interface BookingsPage {
  data: StudentBooking[];
  page: number;
  hasMore: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isBookingStatus(value: unknown): value is BookingStatus {
  return typeof value === "string" && Object.hasOwn(bookingStatuses, value);
}

function isStudentBooking(value: unknown): value is StudentBooking {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.checkIn !== "string" ||
    !Number.isFinite(Date.parse(value.checkIn)) ||
    typeof value.checkOut !== "string" ||
    !Number.isFinite(Date.parse(value.checkOut)) ||
    Date.parse(value.checkOut) <= Date.parse(value.checkIn) ||
    !isBookingStatus(value.status) ||
    !isRecord(value.hostel)
  ) {
    return false;
  }

  return (
    typeof value.hostel.name === "string" &&
    typeof value.hostel.slug === "string" &&
    typeof value.hostel.city === "string" &&
    (typeof value.hostel.coverImage === "string" ||
      value.hostel.coverImage === null)
  );
}

function readApiError(value: unknown): string | null {
  return isRecord(value) && typeof value.error === "string"
    ? value.error
    : null;
}

function parseBookingsPage(value: unknown): BookingsPage | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.data) ||
    !value.data.every(isStudentBooking) ||
    typeof value.page !== "number" ||
    !Number.isInteger(value.page) ||
    value.page < 1 ||
    typeof value.hasMore !== "boolean" ||
    (value.hasMore && value.data.length === 0)
  ) {
    return null;
  }

  return {
    data: value.data,
    page: value.page,
    hasMore: value.hasMore,
  };
}

async function loadBookings(
  page: number,
  signal?: AbortSignal,
): Promise<BookingsPage> {
  const response = await fetch(`/api/bookings?page=${page}&limit=20`, {
    signal,
  });
  const payload: unknown = await response.json();

  if (!response.ok) {
    throw new Error(readApiError(payload) ?? "Could not load your trips.");
  }

  const result = parseBookingsPage(payload);
  if (!result || result.page !== page) {
    throw new Error("The trips response was invalid. Please try again.");
  }

  return result;
}

const dateFormatter = new Intl.DateTimeFormat("en-PK", {
  dateStyle: "medium",
  timeZone: "UTC",
});

const bookingStatusClassNames: Record<BookingStatus, string> = {
  PENDING: "bg-surface-muted text-ink",
  CONFIRMED: "bg-brand-soft text-brand-dark",
  CANCELLED: "bg-[#f5e6e3] text-[#8c2822]",
  COMPLETED: "bg-brand-soft text-brand-dark",
};

export function TripsPageContent({
  bookings,
  error,
  hasMore,
  isLoading,
  isLoadingMore,
  onLoadMore,
  onRetry,
}: {
  bookings: StudentBooking[];
  error: string | null;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
}) {
  return (
    <main className="min-h-screen bg-canvas py-12 md:py-16">
      <div className="mx-auto w-[min(100%-40px,600px)] md:w-[min(1920px,calc(100%-64px))]">
        <header className="mb-7 md:mb-8">
          <h1 className="m-0 text-[clamp(1.7rem,3vw,2.2rem)] font-semibold tracking-[-0.035em] text-ink">
            Trips
          </h1>
          <p className="mt-2 m-0 text-[0.95rem] text-muted">
            Your hostel bookings and stay dates.
          </p>
        </header>

        {isLoading ? (
          <section
            aria-busy="true"
            className="py-8 text-sm text-muted"
            role="status"
          >
            <p className="m-0">Loading trips...</p>
          </section>
        ) : error && bookings.length === 0 ? (
          <section
            className="rounded-[14px] border border-[#e7c9c4] bg-surface p-7 text-[#8c2822]"
            role="alert"
          >
            <p className="m-0 text-[0.95rem]">{error}</p>
            <button
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full border border-current bg-transparent px-4 py-2 font-semibold text-current"
              onClick={onRetry}
              type="button"
            >
              Try again
            </button>
          </section>
        ) : bookings.length === 0 ? (
          <section
            className="rounded-[14px] border border-line bg-surface p-7"
            role="status"
          >
            <h2 className="m-0 text-[1.2rem] font-semibold text-ink">
              No trips yet
            </h2>
            <p className="mt-2 mb-4 text-[0.95rem] text-muted">
              Your hostel bookings will appear here.
            </p>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand px-4 py-2.5 font-semibold text-white"
              href="/"
            >
              Explore hostels
            </Link>
          </section>
        ) : (
          <>
            {error && (
              <p
                className="mb-5 rounded-[14px] border border-[#e7c9c4] bg-surface p-3 text-[0.9rem] text-[#8c2822]"
                role="alert"
              >
                {error}{" "}
                <button
                  className="ml-1 font-semibold text-current underline-offset-2 disabled:opacity-60"
                  disabled={isLoadingMore}
                  onClick={onLoadMore}
                  type="button"
                >
                  Try again
                </button>
              </p>
            )}
            <div className="grid gap-4">
              {bookings.map((booking) => (
                <article
                  className="grid gap-5 overflow-hidden rounded-[14px] border border-line bg-surface p-3 md:grid-cols-[minmax(180px,240px)_minmax(0,1fr)]"
                  key={booking.id}
                >
                  <Link
                    aria-label={`View details for ${booking.hostel.name}`}
                    className="group relative block min-h-[150px] overflow-hidden rounded-[10px] bg-brand-soft"
                    href={`/hostels/${booking.hostel.slug}`}
                  >
                    {booking.hostel.coverImage ? (
                      <Image
                        alt={booking.hostel.name}
                        className={hostelCardImageClassName}
                        fill
                        sizes="(max-width: 720px) 36vw, 220px"
                        src={booking.hostel.coverImage}
                      />
                    ) : (
                      <span className="flex h-full w-full bg-[linear-gradient(135deg,transparent_40%,rgb(47_101_73/16%)),var(--brand-soft)]" />
                    )}
                  </Link>
                  <div className="min-w-0 self-center py-1 md:px-1">
                    <p className="m-0 mb-2 text-[0.9rem] text-muted">
                      {booking.hostel.city}
                    </p>
                    <h2 className="m-0 mb-2 text-[1.15rem] font-semibold leading-[1.3] text-ink">
                      <Link className="text-inherit no-underline" href={`/hostels/${booking.hostel.slug}`}>
                        {booking.hostel.name}
                      </Link>
                    </h2>
                    <p className="m-0 mb-3 text-[0.9rem] text-muted">
                      <time dateTime={booking.checkIn}>
                        {dateFormatter.format(new Date(booking.checkIn))}
                      </time>
                      <span aria-hidden="true"> – </span>
                      <time dateTime={booking.checkOut}>
                        {dateFormatter.format(new Date(booking.checkOut))}
                      </time>
                    </p>
                    <span
                      className={`inline-flex min-h-[28px] items-center rounded-full px-2.5 text-[0.78rem] font-semibold ${bookingStatusClassNames[booking.status]}`}
                      data-status={booking.status.toLowerCase()}
                    >
                      {bookingStatuses[booking.status]}
                    </span>
                  </div>
                </article>
              ))}
            </div>
            {hasMore && (
              <button
                className="mt-7 mx-auto flex min-w-[140px] items-center justify-center rounded-full bg-brand px-4 py-2.5 font-semibold text-white disabled:cursor-wait disabled:opacity-60"
                disabled={isLoadingMore}
                onClick={onLoadMore}
                type="button"
              >
                {isLoadingMore ? "Loading..." : "Show more"}
              </button>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export function TripsPage() {
  const [bookings, setBookings] = useState<StudentBooking[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    void loadBookings(1, controller.signal)
      .then((result) => {
        setBookings(result.data);
        setPage(result.page);
        setHasMore(result.hasMore);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load your trips. Please try again.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [retryCount]);

  async function loadMore() {
    setIsLoadingMore(true);
    setError(null);
    try {
      const result = await loadBookings(page + 1);
      setBookings((current) => [...current, ...result.data]);
      setPage(result.page);
      setHasMore(result.hasMore);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not load more trips. Please try again.",
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  return (
    <TripsPageContent
      bookings={bookings}
      error={error}
      hasMore={hasMore}
      isLoading={isLoading}
      isLoadingMore={isLoadingMore}
      onLoadMore={() => void loadMore()}
      onRetry={() => setRetryCount((count) => count + 1)}
    />
  );
}
