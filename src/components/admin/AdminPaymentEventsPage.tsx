"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Field,
  FormSection,
  controlProps,
  fieldClassName,
  secondaryButtonClassName,
} from "@/components/owner/ListingFormFields";
import { readAdminError } from "./adminListings";
import {
  RETRY_REASON_MAX,
  TRACKER_MAX,
  errorCodeLabel,
  eventTypeLabel,
  formatEventAmount,
  parseAdminPaymentEventsPage,
  retryBlockedReason,
  statusLabel,
  validateRetryReason,
  validateTracker,
  type AdminPaymentEvent,
} from "./adminPaymentEvents";

const PAGE_SIZE = 25;

const dateFormatter = new Intl.DateTimeFormat("en-PK", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Karachi",
});

const dangerButtonClassName =
  "inline-flex min-h-10 cursor-pointer items-center justify-center rounded-[8px] border-0 bg-[#c13515] px-4 text-[0.85rem] font-semibold text-white hover:bg-[#a52c10] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2! focus-visible:outline-brand!";

export interface RetryActionResult {
  /** Error to show on the card; null when the retry was queued. */
  error: string | null;
}

export type RetryAction = (
  event: AdminPaymentEvent,
  input: { providerTracker: string; reason: string },
) => Promise<RetryActionResult>;

export function RetryForm({
  event,
  busy,
  error,
  onConfirm,
  onCancel,
}: {
  event: AdminPaymentEvent;
  busy: boolean;
  error: string | null;
  onConfirm: (input: { providerTracker: string; reason: string }) => void;
  onCancel: () => void;
}) {
  const [tracker, setTracker] = useState("");
  const [reason, setReason] = useState("");
  const [checked, setChecked] = useState(false);
  const [touched, setTouched] = useState(false);
  const trackerError = touched ? validateTracker(tracker, event.tracker) : null;
  const reasonError = touched ? validateRetryReason(reason) : null;
  const idSuffix = event.id;

  return (
    <div className="grid gap-3 rounded-[12px] bg-surface-muted p-4">
      <p className="m-0 text-[0.9rem] text-ink">
        Retrying puts the stored event back in the processing queue. Check the
        payment in Safepay first. Your name, the tracker and your reason are
        recorded and cannot be edited later.
      </p>
      <Field
        error={trackerError ?? undefined}
        hint="Copy the tracker shown above after checking it in Safepay."
        id={`retry-tracker-${idSuffix}`}
        label="Safepay tracker"
      >
        <input
          {...controlProps(
            `retry-tracker-${idSuffix}`,
            trackerError ?? undefined,
            "Copy the tracker shown above after checking it in Safepay.",
          )}
          autoComplete="off"
          className={fieldClassName}
          maxLength={TRACKER_MAX}
          onChange={(changeEvent) => setTracker(changeEvent.target.value)}
          type="text"
          value={tracker}
        />
      </Field>
      <Field
        error={reasonError ?? undefined}
        id={`retry-reason-${idSuffix}`}
        label="Reason"
      >
        <textarea
          {...controlProps(`retry-reason-${idSuffix}`, reasonError ?? undefined)}
          className={fieldClassName}
          maxLength={RETRY_REASON_MAX}
          onChange={(changeEvent) => setReason(changeEvent.target.value)}
          rows={3}
          value={reason}
        />
      </Field>
      <label className="flex items-start gap-2 text-[0.88rem] text-ink">
        <input
          checked={checked}
          className="mt-1"
          onChange={(changeEvent) => setChecked(changeEvent.target.checked)}
          type="checkbox"
        />
        <span>I checked this payment in Safepay.</span>
      </label>
      {error ? (
        <p className="m-0 text-[0.875rem] text-[#c13515]" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          className={dangerButtonClassName}
          disabled={busy || !checked}
          onClick={() => {
            setTouched(true);
            if (
              !validateTracker(tracker, event.tracker) &&
              !validateRetryReason(reason)
            ) {
              onConfirm({
                providerTracker: tracker.trim(),
                reason: reason.trim(),
              });
            }
          }}
          type="button"
        >
          {busy ? "Working…" : "Queue retry"}
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

function EventCard({
  event,
  onRetry,
}: {
  event: AdminPaymentEvent;
  onRetry: RetryAction;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const blocked = retryBlockedReason(event);
  const amount = formatEventAmount(event.amountMinorUnits, event.currency);

  async function confirm(input: { providerTracker: string; reason: string }) {
    setBusy(true);
    setError(null);
    const result = await onRetry(event, input);
    setBusy(false);
    if (result.error) setError(result.error);
    else setConfirming(false);
  }

  return (
    <li className="grid gap-3 rounded-[14px] border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="m-0 text-[1.02rem] font-semibold text-ink">
          {eventTypeLabel(event.eventType)}
        </h3>
        <span
          className={`rounded-full px-[10px] py-[2px] text-[0.72rem] font-bold ${event.status === "RETRYABLE" ? "bg-[#fbf4e6] text-[#583c13]" : "bg-surface-muted text-[#c13515]"}`}
        >
          {statusLabel(event.status)}
        </span>
      </div>
      <dl className="m-0 grid gap-1 text-[0.88rem]">
        {amount ? (
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-muted">Amount</dt>
            <dd className="m-0 text-ink">{amount}</dd>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted">Order</dt>
          <dd className="m-0 break-all text-ink">
            {event.merchantOrderId ?? "Not recorded"}
          </dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted">Safepay tracker</dt>
          <dd className="m-0 break-all text-ink">
            {event.tracker ?? "Not recorded"}
          </dd>
        </div>
        {event.providerState ? (
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-muted">Provider state</dt>
            <dd className="m-0 text-ink">{event.providerState}</dd>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted">Received</dt>
          <dd className="m-0 text-ink">
            {dateFormatter.format(new Date(event.receivedAt))}
          </dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted">Processing attempts</dt>
          <dd className="m-0 text-ink">{event.processingAttempts}</dd>
        </div>
      </dl>
      {event.lastErrorCode ? (
        <p className="m-0 text-[0.85rem] text-[#583c13]">
          {errorCodeLabel(event.lastErrorCode)}{" "}
          <span className="text-muted">({event.lastErrorCode})</span>
        </p>
      ) : null}
      {event.replays.length > 0 ? (
        <div className="grid gap-1">
          <p className="m-0 text-[0.8rem] font-semibold text-muted">
            Recent retries
          </p>
          <ul className="m-0 grid list-none gap-1 p-0 text-[0.85rem] text-ink">
            {event.replays.map((replay) => (
              <li key={`${replay.createdAt}-${replay.adminUserId}`}>
                {dateFormatter.format(new Date(replay.createdAt))}: “
                {replay.reason}”
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {blocked ? (
        <p className="m-0 text-[0.85rem] text-[#583c13]">{blocked}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              setError(null);
              setConfirming((open) => !open);
            }}
            type="button"
          >
            Retry processing
          </button>
        </div>
      )}
      {confirming && !blocked ? (
        <RetryForm
          busy={busy}
          error={error}
          event={event}
          onCancel={() => {
            setConfirming(false);
            setError(null);
          }}
          onConfirm={(input) => void confirm(input)}
        />
      ) : null}
    </li>
  );
}

export interface AdminPaymentEventsContentProps {
  events: AdminPaymentEvent[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  loadError: string | null;
  moreError: string | null;
  notice: { tone: "success" | "error"; text: string } | null;
  onRetry: () => void;
  onLoadMore: () => void;
  onRetryEvent: RetryAction;
}

export function AdminPaymentEventsContent({
  events,
  total,
  hasMore,
  isLoading,
  isLoadingMore,
  loadError,
  moreError,
  notice,
  onRetry,
  onLoadMore,
  onRetryEvent,
}: AdminPaymentEventsContentProps) {
  return (
    <main className="mx-auto w-[min(760px,calc(100%-var(--page-gutter-mobile)))] pb-16 pt-8 md:pt-10">
      <Link
        className="text-[0.85rem] font-semibold text-brand hover:underline"
        href="/admin"
      >
        ← Back to admin console
      </Link>
      <h1 className="mb-0 mt-3 text-[clamp(1.6rem,3vw,2.1rem)] font-semibold tracking-[-0.035em] text-ink">
        Payment events
      </h1>
      <p className="mb-6 mt-2 text-[0.95rem] text-muted">
        Safepay payment notifications that did not finish processing. Events
        that can be retried are replayed from the evidence stored when they
        arrived. You can queue up to 5 retries an hour.
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

        <FormSection title="Needs attention">
          {isLoading ? (
            <p className="m-0 text-muted" role="status">
              Loading payment events...
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
          ) : events.length === 0 ? (
            <p className="m-0 text-[0.92rem] text-muted">
              No payment events need attention.
            </p>
          ) : (
            <>
              <p aria-live="polite" className="m-0 text-[0.85rem] text-muted">
                {total} {total === 1 ? "event needs" : "events need"} attention
              </p>
              <ul className="m-0 grid list-none gap-3 p-0">
                {events.map((event) => (
                  <EventCard
                    event={event}
                    key={event.id}
                    onRetry={onRetryEvent}
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
            <div className="text-center">
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
        </FormSection>
      </div>
    </main>
  );
}

async function fetchEvents(page: number, signal?: AbortSignal) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
  });
  const response = await fetch(`/api/admin/payment-events?${params.toString()}`, {
    signal,
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(readAdminError(payload, "Could not load payment events."));
  }
  const parsed = parseAdminPaymentEventsPage(payload);
  if (!parsed) throw new Error("Could not load payment events.");
  return parsed;
}

export function AdminPaymentEventsPage() {
  const [events, setEvents] = useState<AdminPaymentEvent[]>([]);
  const [total, setTotal] = useState(0);
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
    fetchEvents(1, controller.signal)
      .then((result) => {
        setEvents(result.data);
        setTotal(result.total);
        setPage(result.page);
        setHasMore(result.hasMore);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof Error
            ? error.message
            : "Could not load payment events.",
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
      const result = await fetchEvents(page + 1);
      setEvents((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...result.data.filter((item) => !seen.has(item.id))];
      });
      setTotal(result.total);
      setPage(result.page);
      setHasMore(result.hasMore);
    } catch (error) {
      setMoreError(
        error instanceof Error
          ? error.message
          : "Could not load more payment events.",
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [page]);

  const retryEvent = useCallback<RetryAction>(async (event, input) => {
    const fallback = "We couldn't queue this retry. Please try again.";
    try {
      const response = await fetch(
        `/api/admin/payment-events/${encodeURIComponent(event.id)}/retry`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            providerChecked: true,
            providerTracker: input.providerTracker,
            reason: input.reason,
          }),
        },
      );
      const payload: unknown = await response.json().catch(() => null);
      if (response.ok) {
        setNotice({
          tone: "success",
          text: "Retry queued. The event leaves this list once it is processing.",
        });
        setRetryCount((count) => count + 1);
        return { error: null };
      }
      const message = readAdminError(payload, fallback);
      if (response.status === 404 || response.status === 409) {
        // Someone else changed the event; show fresh data.
        setNotice({ tone: "error", text: message });
        setRetryCount((count) => count + 1);
      }
      return { error: message };
    } catch {
      return { error: fallback };
    }
  }, []);

  return (
    <AdminPaymentEventsContent
      events={events}
      hasMore={hasMore}
      isLoading={isLoading}
      isLoadingMore={isLoadingMore}
      loadError={loadError}
      moreError={moreError}
      notice={notice}
      onLoadMore={() => void loadMore()}
      onRetry={() => setRetryCount((count) => count + 1)}
      onRetryEvent={retryEvent}
      total={total}
    />
  );
}
