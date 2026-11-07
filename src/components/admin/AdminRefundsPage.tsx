"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  FormSection,
  secondaryButtonClassName,
} from "@/components/owner/ListingFormFields";
import { AdminUncertainActionNotice } from "./AdminUncertainActionNotice";
import { isUncertainAdminActionStatus } from "./adminActionState";
import { readAdminError } from "./adminListings";
import {
  isUnresolved,
  parseRefundBookingsPage,
  refundOutcome,
  refundStateLabel,
  type RefundBooking,
} from "./adminRefunds";

const PAGE_SIZE = 50;

const currencyFormatter = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-PK", {
  dateStyle: "medium",
  timeZone: "UTC",
});

const dangerButtonClassName =
  "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-[8px] border-0 bg-[#c13515] px-4 text-[0.85rem] font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25),inset_0_-2px_0_rgb(0_0_0/0.18),0_2px_3px_rgb(15_23_42/0.22)] transition-[background-color,box-shadow,translate] duration-150 hover:bg-[#a52c10] active:translate-y-px active:bg-[#8f240d] active:shadow-[inset_0_3px_6px_rgb(0_0_0/0.3)] disabled:cursor-wait disabled:opacity-60 disabled:shadow-none disabled:active:translate-y-0 motion-reduce:transition-none motion-reduce:active:translate-y-0 focus-visible:outline-2! focus-visible:outline-brand!";

export interface RefundActionResult {
  /** Error to show on the card; null when the action succeeded. */
  error: string | null;
  uncertain?: boolean;
}

export type RefundAction = (
  booking: RefundBooking,
  manual: boolean,
) => Promise<RefundActionResult>;

export function RefundConfirmForm({
  booking,
  manual,
  busy,
  error,
  onConfirm,
  onCancel,
}: {
  booking: RefundBooking;
  manual: boolean;
  busy: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [verified, setVerified] = useState(false);
  const amount = currencyFormatter.format(booking.remainingAmount);

  return (
    <div className="grid gap-3 rounded-[12px] bg-surface-muted p-4">
      {manual ? (
        <>
          <p className="m-0 text-[0.9rem] text-ink">
            Record {amount} as refunded to {booking.studentName}. Do this only
            after you have checked in Safepay that the money was returned. The
            student is told the refund was processed, and this cannot be
            undone.
          </p>
          <label className="flex items-start gap-2 text-[0.88rem] text-ink">
            <input
              checked={verified}
              className="mt-1"
              onChange={(event) => setVerified(event.target.checked)}
              type="checkbox"
            />
            <span>I verified this refund in Safepay.</span>
          </label>
        </>
      ) : (
        <p className="m-0 text-[0.9rem] text-ink">
          Send {amount} back to {booking.studentName} through Safepay? The
          student is told the refund was processed, and this cannot be undone.
          If Safepay does not confirm the result, the booking is marked as
          unconfirmed and no second automatic request is allowed.
        </p>
      )}
      {error ? (
        <p className="m-0 text-[0.875rem] text-[#c13515]" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          className={dangerButtonClassName}
          disabled={busy || (manual && !verified)}
          onClick={onConfirm}
          type="button"
        >
          {busy
            ? "Working…"
            : manual
              ? "Confirm refund manually"
              : "Send refund"}
        </button>
        <button
          className={secondaryButtonClassName}
          disabled={busy}
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function RefundCard({
  booking,
  onRefund,
}: {
  booking: RefundBooking;
  onRefund: RefundAction;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const unresolved = isUnresolved(booking.refundState);

  async function confirm() {
    setBusy(true);
    setError(null);
    const result = await onRefund(booking, unresolved);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      setUncertain(result.uncertain === true);
    }
    else setConfirming(false);
  }

  return (
    <li className="grid gap-3 rounded-[14px] border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="m-0 text-[1.02rem] font-semibold text-ink">
          {booking.studentName}
        </h3>
        <span
          className={`rounded-full px-[10px] py-[2px] text-[0.72rem] font-bold ${unresolved ? "bg-[#fbf4e6] text-[#583c13]" : "bg-surface-muted text-muted"}`}
        >
          {refundStateLabel(booking.refundState)}
        </span>
      </div>
      <p className="m-0 text-[0.85rem] text-muted">
        {booking.hostelName} ·{" "}
        {dateFormatter.format(new Date(booking.checkIn))} to{" "}
        {dateFormatter.format(new Date(booking.checkOut))}
      </p>
      <Link
        className="w-fit text-[0.85rem] font-semibold text-brand hover:underline"
        href={`/admin/bookings/${encodeURIComponent(booking.id)}`}
      >
        View booking
      </Link>
      <dl className="m-0 grid gap-1 text-[0.88rem]">
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted">Paid</dt>
          <dd className="m-0 text-ink">
            {currencyFormatter.format(booking.total)}
          </dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted">Approved by cancellation terms</dt>
          <dd className="m-0 text-ink">
            {currencyFormatter.format(booking.approvedAmount)}
          </dd>
        </div>
        {booking.refundedAmount > 0 ? (
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-muted">Already refunded</dt>
            <dd className="m-0 text-ink">
              {currencyFormatter.format(booking.refundedAmount)}
            </dd>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted">Left to refund</dt>
          <dd className="m-0 font-semibold text-ink">
            {currencyFormatter.format(booking.remainingAmount)}
          </dd>
        </div>
      </dl>
      {unresolved ? (
        <p className="m-0 text-[0.85rem] text-[#583c13]">
          {booking.refundState === "PROCESSING"
            ? "An automatic refund is still processing. Manual confirmation is only accepted if it has been stuck for more than 5 minutes."
            : "Safepay did not confirm the last automatic refund. Check Safepay before doing anything else; a second automatic request is blocked."}
        </p>
      ) : null}
      {uncertain ? (
        <AdminUncertainActionNotice />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              className={secondaryButtonClassName}
              onClick={() => {
                setError(null);
                setConfirming((open) => !open);
              }}
              type="button"
            >
              {unresolved ? "Confirm refund manually" : "Refund via Safepay"}
            </button>
          </div>
          {confirming ? (
            <RefundConfirmForm
              booking={booking}
              busy={busy}
              error={error}
              manual={unresolved}
              onCancel={() => {
                setConfirming(false);
                setError(null);
              }}
              onConfirm={() => void confirm()}
            />
          ) : null}
        </>
      )}
    </li>
  );
}

export interface AdminRefundsContentProps {
  bookings: RefundBooking[];
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  loadError: string | null;
  moreError: string | null;
  notice: { tone: "success" | "error"; text: string } | null;
  onRetry: () => void;
  onLoadMore: () => void;
  onRefund: RefundAction;
}

export function AdminRefundsContent({
  bookings,
  hasMore,
  isLoading,
  isLoadingMore,
  loadError,
  moreError,
  notice,
  onRetry,
  onLoadMore,
  onRefund,
}: AdminRefundsContentProps) {
  return (
    <main className="mx-auto w-[min(760px,calc(100%-var(--page-gutter-mobile)))] pb-16 pt-8 md:pt-10">
      <Link
        className="text-[0.85rem] font-semibold text-brand hover:underline"
        href="/admin"
      >
        ← Back to admin console
      </Link>
      <h1 className="mb-0 mt-3 text-[clamp(1.6rem,3vw,2.1rem)] font-semibold tracking-[-0.035em] text-ink">
        Refunds
      </h1>
      <p className="mb-6 mt-2 text-[0.95rem] text-muted">
        Cancelled bookings that were paid and still have money to return. The
        amount comes from the cancellation terms. You can send up to 5 refund
        actions an hour.
      </p>

      <div className="grid gap-5">
        {notice ? (
          <p
            className={`m-0 rounded-[14px] px-[13px] py-[11px] text-[0.875rem] ${notice.tone === "success" ? "bg-brand-soft text-brand-dark" : "bg-surface-muted text-[#c13515]"}`}
            role={notice.tone === "success" ? "status" : "alert"}
          >
            {notice.text}
          </p>
        ) : null}

        <FormSection title="Needs a refund">
          {isLoading ? (
            <p className="m-0 text-muted" role="status">
              Loading cancelled bookings...
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
          ) : bookings.length === 0 ? (
            <p className="m-0 text-[0.92rem] text-muted">
              {hasMore
                ? "No refunds are needed in the bookings loaded so far."
                : "No cancelled bookings need a refund."}
            </p>
          ) : (
            <>
              <p aria-live="polite" className="m-0 text-[0.85rem] text-muted">
                {bookings.length}{" "}
                {bookings.length === 1 ? "booking needs" : "bookings need"} a
                refund
              </p>
              <ul className="m-0 grid list-none gap-3 p-0">
                {bookings.map((booking) => (
                  <RefundCard
                    booking={booking}
                    key={booking.id}
                    onRefund={onRefund}
                  />
                ))}
              </ul>
            </>
          )}
          {moreError ? (
            <p
              className="m-0 rounded-[14px] bg-surface-muted px-[13px] py-[11px] text-[0.875rem] text-[#c13515]"
              role="alert"
            >
              {moreError}
            </p>
          ) : null}
          {hasMore ? (
            <div className="grid gap-2 text-center">
              <p className="m-0 text-[0.8125rem] text-muted">
                There is no refund queue endpoint, so this page loads cancelled
                bookings newest first and shows the ones that need a refund.
              </p>
              <div>
                <button
                  className={secondaryButtonClassName}
                  disabled={isLoadingMore}
                  onClick={onLoadMore}
                  type="button"
                >
                  {isLoadingMore ? "Loading…" : "Load older bookings"}
                </button>
              </div>
            </div>
          ) : null}
        </FormSection>
      </div>
    </main>
  );
}

async function fetchCancelled(page: number, signal?: AbortSignal) {
  const params = new URLSearchParams({
    status: "CANCELLED",
    page: String(page),
    limit: String(PAGE_SIZE),
  });
  const response = await fetch(`/api/bookings?${params.toString()}`, {
    signal,
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(readAdminError(payload, "Could not load bookings."));
  }
  const parsed = parseRefundBookingsPage(payload);
  if (!parsed) throw new Error("Could not load bookings.");
  return parsed;
}

export function AdminRefundsPage() {
  const [bookings, setBookings] = useState<RefundBooking[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [moreError, setMoreError] = useState<string | null>(null);
  const [notice, setNotice] = useState<
    { tone: "success" | "error"; text: string } | null
  >(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setLoadError(null);
    setMoreError(null);
    fetchCancelled(1, controller.signal)
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
  }, [retryCount]);

  const loadMore = useCallback(async () => {
    setIsLoadingMore(true);
    setMoreError(null);
    try {
      const result = await fetchCancelled(page + 1);
      setBookings((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...result.data.filter((item) => !seen.has(item.id))];
      });
      setPage(result.page);
      setHasMore(result.hasMore);
    } catch (error) {
      setMoreError(
        error instanceof Error
          ? error.message
          : "Could not load more bookings.",
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [page]);

  const refund = useCallback<RefundAction>(async (booking, manual) => {
    const fallback = "We couldn't process this refund. Please try again.";
    try {
      const response = await fetch(
        `/api/admin/bookings/${encodeURIComponent(booking.id)}/refund`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(manual ? { manualConfirmation: true } : {}),
        },
      );
      const payload: unknown = await response.json().catch(() => null);
      if (response.ok) {
        const record =
          typeof payload === "object" && payload !== null
            ? (payload as Record<string, unknown>)
            : {};
        setNotice(
          refundOutcome(booking.studentName, {
            automatic: record.automatic === true,
            manualConfirmed: record.manualConfirmed === true,
          }),
        );
        setRetryCount((count) => count + 1);
        return { error: null };
      }
      const message = readAdminError(payload, fallback);
      if (response.status === 404 || response.status === 409) {
        // The booking moved on (another admin, a webhook); show fresh data.
        setNotice({ tone: "error", text: message });
        setRetryCount((count) => count + 1);
      }
      return {
        error: message,
        uncertain: isUncertainAdminActionStatus(response.status),
      };
    } catch {
      return { error: fallback, uncertain: true };
    }
  }, []);

  return (
    <AdminRefundsContent
      bookings={bookings}
      hasMore={hasMore}
      isLoading={isLoading}
      isLoadingMore={isLoadingMore}
      loadError={loadError}
      moreError={moreError}
      notice={notice}
      onLoadMore={() => void loadMore()}
      onRefund={refund}
      onRetry={() => setRetryCount((count) => count + 1)}
    />
  );
}
