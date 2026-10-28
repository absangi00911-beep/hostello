"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

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
    <main className="student-page">
      <div className="student-page-shell">
        <header className="student-page-header">
          <h1>Trips</h1>
          <p>Your hostel bookings and stay dates.</p>
        </header>

        {isLoading ? (
          <section aria-busy="true" className="student-page-state" role="status">
            <p>Loading trips...</p>
          </section>
        ) : error && bookings.length === 0 ? (
          <section className="student-page-error" role="alert">
            <p>{error}</p>
            <button onClick={onRetry} type="button">
              Try again
            </button>
          </section>
        ) : bookings.length === 0 ? (
          <section className="student-page-empty" role="status">
            <h2>No trips yet</h2>
            <p>Your hostel bookings will appear here.</p>
            <Link href="/">Explore hostels</Link>
          </section>
        ) : (
          <>
            {error && (
              <p className="student-page-error" role="alert">
                {error}{" "}
                <button
                  disabled={isLoadingMore}
                  onClick={onLoadMore}
                  type="button"
                >
                  Try again
                </button>
              </p>
            )}
            <div className="student-booking-list">
              {bookings.map((booking) => (
                <article className="student-booking-card" key={booking.id}>
                  <Link
                    aria-label={`View details for ${booking.hostel.name}`}
                    className="student-booking-image"
                    href={`/hostels/${booking.hostel.slug}`}
                  >
                    {booking.hostel.coverImage ? (
                      <Image
                        alt={booking.hostel.name}
                        fill
                        sizes="(max-width: 720px) 36vw, 220px"
                        src={booking.hostel.coverImage}
                      />
                    ) : (
                      <span aria-hidden="true" className="hostel-image-fallback" />
                    )}
                  </Link>
                  <div className="student-booking-details">
                    <p className="student-booking-city">{booking.hostel.city}</p>
                    <h2>
                      <Link href={`/hostels/${booking.hostel.slug}`}>
                        {booking.hostel.name}
                      </Link>
                    </h2>
                    <p className="student-booking-dates">
                      <time dateTime={booking.checkIn}>
                        {dateFormatter.format(new Date(booking.checkIn))}
                      </time>
                      <span aria-hidden="true"> – </span>
                      <time dateTime={booking.checkOut}>
                        {dateFormatter.format(new Date(booking.checkOut))}
                      </time>
                    </p>
                    <span
                      className="student-booking-status"
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
                className="student-page-load-more"
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
