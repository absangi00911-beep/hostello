"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Field,
  FormSection,
  primaryButtonClassName,
  secondaryButtonClassName,
  fieldClassName,
} from "./ListingFormFields";
import {
  REASON_MAX_LENGTH,
  formatBlockedRange,
  parseBlockedRangesPage,
  parseCreatedRange,
  readBlockedDatesError,
  validateBlockedRange,
  type BlockedRange,
  type BlockedRangeInput,
} from "./ownerBlockedDates";

const PAGE_SIZE = 20;

const emptyForm: BlockedRangeInput = { startDate: "", endDate: "", reason: "" };

function RangeRow({
  range,
  isRemoving,
  onRemove,
}: {
  range: BlockedRange;
  isRemoving: boolean;
  onRemove: (id: string) => void;
}) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-3 rounded-[14px] border border-line bg-surface p-4">
      <div className="grid gap-1">
        <span className="text-[1rem] font-semibold text-ink">
          {formatBlockedRange(range.startDate, range.endDate)}
        </span>
        {range.reason ? (
          <span className="text-[0.85rem] text-muted">{range.reason}</span>
        ) : null}
      </div>
      <button
        aria-label={`Remove block ${formatBlockedRange(range.startDate, range.endDate)}`}
        className={secondaryButtonClassName}
        disabled={isRemoving}
        onClick={() => onRemove(range.id)}
        type="button"
      >
        {isRemoving ? "Removing…" : "Remove"}
      </button>
    </li>
  );
}

export interface OwnerBlockedDatesContentProps {
  listingName: string;
  isLoading: boolean;
  loadError: string | null;
  ranges: BlockedRange[];
  total: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  moreError: string | null;
  removingId: string | null;
  removeError: string | null;
  form: BlockedRangeInput;
  formError: string | null;
  isSaving: boolean;
  onFormChange: (next: BlockedRangeInput) => void;
  onSubmit: () => void;
  onRemove: (id: string) => void;
  onRetry: () => void;
  onLoadMore: () => void;
}

export function OwnerBlockedDatesContent({
  listingName,
  isLoading,
  loadError,
  ranges,
  total,
  hasMore,
  isLoadingMore,
  moreError,
  removingId,
  removeError,
  form,
  formError,
  isSaving,
  onFormChange,
  onSubmit,
  onRemove,
  onRetry,
  onLoadMore,
}: OwnerBlockedDatesContentProps) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <main className="mx-auto w-[min(760px,calc(100%-var(--page-gutter-mobile)))] pb-16 pt-8 md:pt-10">
      <Link
        className="text-[0.85rem] font-semibold text-brand hover:underline"
        href="/owner"
      >
        ← Back to dashboard
      </Link>
      <h1 className="mb-0 mt-3 text-[clamp(1.6rem,3vw,2.1rem)] font-semibold tracking-[-0.035em] text-ink">
        Blocked dates
      </h1>
      <p className="mb-6 mt-2 text-[0.95rem] text-muted">{listingName}</p>

      <div className="grid gap-5">
        <FormSection
          description="Students can't book a move-in date inside a blocked range. Existing bookings aren't cancelled."
          title="Block new dates"
        >
          <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="blocked-start" label="From">
                <input
                  className={fieldClassName}
                  id="blocked-start"
                  onChange={(event) =>
                    onFormChange({ ...form, startDate: event.target.value })
                  }
                  type="date"
                  value={form.startDate}
                />
              </Field>
              <Field id="blocked-end" label="To (included)">
                <input
                  className={fieldClassName}
                  id="blocked-end"
                  min={form.startDate || undefined}
                  onChange={(event) =>
                    onFormChange({ ...form, endDate: event.target.value })
                  }
                  type="date"
                  value={form.endDate}
                />
              </Field>
            </div>
            <Field id="blocked-reason" label="Reason (optional)">
              <input
                className={fieldClassName}
                id="blocked-reason"
                maxLength={REASON_MAX_LENGTH}
                onChange={(event) =>
                  onFormChange({ ...form, reason: event.target.value })
                }
                placeholder="For example, repairs"
                type="text"
                value={form.reason}
              />
            </Field>
            {formError ? (
              <p
                className="m-0 rounded-[14px] bg-surface-muted px-[13px] py-[11px] text-[0.875rem] text-danger"
                role="alert"
              >
                {formError}
              </p>
            ) : null}
            <div>
              <button
                className={primaryButtonClassName}
                disabled={isSaving}
                type="submit"
              >
                {isSaving ? "Saving…" : "Block these dates"}
              </button>
            </div>
          </form>
        </FormSection>

        <FormSection title="Blocked ranges">
          {isLoading ? (
            <p className="m-0 text-muted" role="status">
              Loading blocked dates...
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
          ) : ranges.length === 0 ? (
            <p className="m-0 text-[0.92rem] text-muted">
              No blocked dates. Every date is open for booking.
            </p>
          ) : (
            <>
              <p aria-live="polite" className="m-0 text-[0.85rem] text-muted">
                {total} {total === 1 ? "range" : "ranges"}
              </p>
              <ul className="m-0 grid list-none gap-3 p-0">
                {ranges.map((range) => (
                  <RangeRow
                    isRemoving={removingId === range.id}
                    key={range.id}
                    onRemove={onRemove}
                    range={range}
                  />
                ))}
              </ul>
            </>
          )}
          {removeError ? (
            <p
              className="m-0 rounded-[14px] bg-surface-muted px-[13px] py-[11px] text-[0.875rem] text-danger"
              role="alert"
            >
              {removeError}
            </p>
          ) : null}
          {moreError ? (
            <p
              className="m-0 rounded-[14px] bg-surface-muted px-[13px] py-[11px] text-[0.875rem] text-danger"
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

async function fetchRanges(hostelId: string, page: number, signal?: AbortSignal) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
  });
  const response = await fetch(
    `/api/owner/hostels/${encodeURIComponent(hostelId)}/blocked-dates?${params.toString()}`,
    { signal },
  );
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(readBlockedDatesError(payload, "Could not load blocked dates."));
  }
  const parsed = parseBlockedRangesPage(payload);
  if (!parsed) throw new Error("Could not load blocked dates.");
  return parsed;
}

export function OwnerBlockedDatesPage({
  hostelId,
  listingName,
}: {
  hostelId: string;
  listingName: string;
}) {
  const [ranges, setRanges] = useState<BlockedRange[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [moreError, setMoreError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [form, setForm] = useState<BlockedRangeInput>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setLoadError(null);
    setMoreError(null);
    fetchRanges(hostelId, 1, controller.signal)
      .then((result) => {
        setRanges(result.data);
        setTotal(result.total);
        setPage(result.page);
        setHasMore(result.hasMore);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof Error ? error.message : "Could not load blocked dates.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [hostelId, retryCount]);

  const loadMore = useCallback(async () => {
    setIsLoadingMore(true);
    setMoreError(null);
    try {
      const result = await fetchRanges(hostelId, page + 1);
      setRanges((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...result.data.filter((item) => !seen.has(item.id))];
      });
      setTotal(result.total);
      setPage(result.page);
      setHasMore(result.hasMore);
    } catch (error) {
      setMoreError(
        error instanceof Error ? error.message : "Could not load more blocked dates.",
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [hostelId, page]);

  const submit = useCallback(async () => {
    const validationError = validateBlockedRange(form);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError(null);
    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/owner/hostels/${encodeURIComponent(hostelId)}/blocked-dates`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startDate: form.startDate,
            endDate: form.endDate,
            reason: form.reason.trim() || null,
          }),
        },
      );
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok || !parseCreatedRange(payload)) {
        setFormError(
          readBlockedDatesError(
            payload,
            "We couldn't block those dates. Please try again.",
          ),
        );
        return;
      }
      setForm(emptyForm);
      // Reload from page 1 so the new range lands in its sorted position.
      setRetryCount((count) => count + 1);
    } catch {
      setFormError("We couldn't block those dates. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [form, hostelId]);

  const remove = useCallback(
    async (id: string) => {
      setRemovingId(id);
      setRemoveError(null);
      try {
        const response = await fetch(
          `/api/owner/hostels/${encodeURIComponent(hostelId)}/blocked-dates`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
          },
        );
        if (!response.ok) {
          const payload: unknown = await response.json().catch(() => null);
          setRemoveError(
            readBlockedDatesError(payload, "We couldn't remove that block. Please try again."),
          );
          return;
        }
        setRanges((current) => current.filter((item) => item.id !== id));
        setTotal((current) => Math.max(0, current - 1));
      } catch {
        setRemoveError("We couldn't remove that block. Please try again.");
      } finally {
        setRemovingId(null);
      }
    },
    [hostelId],
  );

  return (
    <OwnerBlockedDatesContent
      form={form}
      formError={formError}
      hasMore={hasMore}
      isLoading={isLoading}
      isLoadingMore={isLoadingMore}
      isSaving={isSaving}
      listingName={listingName}
      loadError={loadError}
      moreError={moreError}
      onFormChange={setForm}
      onLoadMore={() => void loadMore()}
      onRemove={(id) => void remove(id)}
      onRetry={() => setRetryCount((count) => count + 1)}
      onSubmit={() => void submit()}
      ranges={ranges}
      removeError={removeError}
      removingId={removingId}
      total={total}
    />
  );
}
