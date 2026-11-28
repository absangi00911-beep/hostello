"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  FormSection,
  fieldClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "./ListingFormFields";
import {
  REPLY_MAX_LENGTH,
  REVIEW_FILTERS,
  parseReviewsPage,
  parseSavedReply,
  readReviewsError,
  validateReply,
  withReplyCountChange,
  type OwnerReview,
  type ReviewFilter,
  type ReviewStats,
} from "./ownerReviews";

const PAGE_SIZE = 20;

const dateFormatter = new Intl.DateTimeFormat("en-PK", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Karachi",
});

/** Resolves to an error message, or null when the change went through. */
export type ReplyAction = (reviewId: string, text: string) => Promise<string | null>;
export type RemoveReplyAction = (reviewId: string) => Promise<string | null>;

function ReviewCard({
  review,
  onSaveReply,
  onRemoveReply,
}: {
  review: OwnerReview;
  onSaveReply: ReplyAction;
  onRemoveReply: RemoveReplyAction;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(review.ownerReply ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    const validationError = validateReply(text);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setBusy(true);
    const failure = await onSaveReply(review.id, text.trim());
    setBusy(false);
    if (failure) setError(failure);
    else setEditing(false);
  }

  async function remove() {
    setError(null);
    setBusy(true);
    const failure = await onRemoveReply(review.id);
    setBusy(false);
    if (failure) setError(failure);
    else {
      setText("");
      setEditing(false);
    }
  }

  return (
    <li className="grid gap-3 rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span
          aria-label={`${review.rating} out of 5 stars`}
          className="text-body font-semibold text-ink"
        >
          ★ {review.rating}/5
        </span>
        <span className="text-label font-semibold text-ink">
          {review.reviewerName}
        </span>
        <span className="text-label text-muted">
          {dateFormatter.format(new Date(review.createdAt))}
        </span>
      </div>
      <p className="m-0 text-label text-muted">
        {review.hostelName}
        {review.stay
          ? ` · stayed ${dateFormatter.format(new Date(review.stay.checkIn))} to ${dateFormatter.format(new Date(review.stay.checkOut))}`
          : ""}
      </p>
      {review.title ? (
        <p className="m-0 text-body font-semibold text-ink">{review.title}</p>
      ) : null}
      <p className="m-0 whitespace-pre-line text-body text-ink">
        {review.comment}
      </p>

      {editing ? (
        <div className="grid gap-2">
          <label
            className="text-label font-semibold text-ink"
            htmlFor={`reply-${review.id}`}
          >
            Your public reply
          </label>
          <textarea
            aria-invalid={error ? true : undefined}
            className={`${fieldClassName} min-h-[110px]`}
            id={`reply-${review.id}`}
            maxLength={REPLY_MAX_LENGTH}
            onChange={(event) => setText(event.target.value)}
            value={text}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              className={primaryButtonClassName}
              disabled={busy}
              onClick={() => void save()}
              type="button"
            >
              {busy ? "Saving…" : "Save reply"}
            </button>
            <button
              className={secondaryButtonClassName}
              disabled={busy}
              onClick={() => {
                setEditing(false);
                setText(review.ownerReply ?? "");
                setError(null);
              }}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : review.ownerReply ? (
        <div className="grid gap-2 rounded-[12px] bg-surface-muted p-3">
          <p className="m-0 text-label font-semibold text-muted">
            Your reply
            {review.repliedAt
              ? ` · ${dateFormatter.format(new Date(review.repliedAt))}`
              : ""}
          </p>
          <p className="m-0 whitespace-pre-line text-label text-ink">
            {review.ownerReply}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              className={secondaryButtonClassName}
              disabled={busy}
              onClick={() => setEditing(true)}
              type="button"
            >
              Edit reply
            </button>
            <button
              className={secondaryButtonClassName}
              disabled={busy}
              onClick={() => void remove()}
              type="button"
            >
              {busy ? "Removing…" : "Delete reply"}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <button
            aria-label={`Reply to review for ${review.hostelName}`}
            className={secondaryButtonClassName}
            onClick={() => setEditing(true)}
            type="button"
          >
            Reply
          </button>
        </div>
      )}

      {error ? (
        <p
          className="m-0 rounded-xl bg-surface-muted px-[13px] py-[11px] text-label text-danger"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </li>
  );
}

function StatsRow({ stats }: { stats: ReviewStats }) {
  const items = [
    { label: "Reviews", value: String(stats.total) },
    {
      label: "Average rating",
      value: stats.avgRating === null ? "–" : stats.avgRating.toFixed(1),
    },
    {
      label: "Reply rate",
      value: stats.responseRate === null ? "–" : `${Math.round(stats.responseRate)}%`,
    },
  ];
  return (
    <dl className="m-0 grid grid-cols-3 gap-3">
      {items.map((item) => (
        <div
          className="grid gap-1 rounded-xl border border-line bg-surface p-4"
          key={item.label}
        >
          <dt className="text-label font-semibold text-muted">{item.label}</dt>
          <dd className="m-0 text-headline font-bold tracking-[-0.03em] text-ink">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export interface OwnerReviewsContentProps {
  filter: ReviewFilter;
  reviews: OwnerReview[];
  stats: ReviewStats | null;
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  loadError: string | null;
  moreError: string | null;
  onFilterChange: (filter: ReviewFilter) => void;
  onRetry: () => void;
  onLoadMore: () => void;
  onSaveReply: ReplyAction;
  onRemoveReply: RemoveReplyAction;
}

export function OwnerReviewsContent({
  filter,
  reviews,
  stats,
  total,
  hasMore,
  isLoading,
  isLoadingMore,
  loadError,
  moreError,
  onFilterChange,
  onRetry,
  onLoadMore,
  onSaveReply,
  onRemoveReply,
}: OwnerReviewsContentProps) {
  return (
    <main id="main-content" className="mx-auto w-[min(760px,calc(100%-var(--page-gutter-mobile)))] pb-16 pt-8 md:pt-10">
      <Link
        className="text-label font-semibold text-brand hover:underline"
        href="/owner"
      >
        ← Back to dashboard
      </Link>
      <h1 className="mb-0 mt-3 text-display font-semibold tracking-[-0.035em] text-ink">
        Reviews
      </h1>
      <p className="mb-6 mt-2 text-body text-muted">
        Replies are public and appear under the review on your listing.
      </p>

      <div className="grid gap-5">
        {stats ? <StatsRow stats={stats} /> : null}

        <div aria-label="Filter reviews" className="flex flex-wrap gap-2" role="group">
          {REVIEW_FILTERS.map((option) => (
            <button
              aria-pressed={filter === option.value}
              className={`${secondaryButtonClassName} ${filter === option.value ? "border-brand! bg-brand-soft! text-brand-dark!" : ""}`}
              key={option.value}
              onClick={() => onFilterChange(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>

        <FormSection title="Reviews">
          {isLoading ? (
            <p className="m-0 text-muted" role="status">
              Loading reviews...
            </p>
          ) : loadError ? (
            <div className="rounded-xl bg-surface-muted p-4" role="alert">
              <p className="m-0 text-danger">{loadError}</p>
              <button
                className={`${secondaryButtonClassName} mt-3`}
                onClick={onRetry}
                type="button"
              >
                Try again
              </button>
            </div>
          ) : reviews.length === 0 ? (
            <p className="m-0 text-body text-muted">
              {filter === "all"
                ? "No reviews yet. Students can review a hostel after a completed stay."
                : "No reviews match this filter."}
            </p>
          ) : (
            <>
              <p aria-live="polite" className="m-0 text-label text-muted">
                {total} {total === 1 ? "review" : "reviews"}
              </p>
              <ul className="m-0 grid list-none gap-3 p-0">
                {reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    onRemoveReply={onRemoveReply}
                    onSaveReply={onSaveReply}
                    review={review}
                  />
                ))}
              </ul>
            </>
          )}
          {moreError ? (
            <p
              className="m-0 rounded-xl bg-surface-muted px-[13px] py-[11px] text-label text-danger"
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

async function fetchReviews(
  filter: ReviewFilter,
  page: number,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
  });
  if (filter !== "all") params.set("filter", filter);
  const response = await fetch(`/api/reviews/mine?${params.toString()}`, { signal });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(readReviewsError(payload, "Could not load your reviews."));
  }
  const parsed = parseReviewsPage(payload);
  if (!parsed) throw new Error("Could not load your reviews.");
  return parsed;
}

export function OwnerReviewsPage() {
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const [reviews, setReviews] = useState<OwnerReview[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [moreError, setMoreError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setLoadError(null);
    setMoreError(null);
    fetchReviews(filter, 1, controller.signal)
      .then((result) => {
        setReviews(result.data);
        setStats(result.stats);
        setTotal(result.total);
        setPage(result.page);
        setHasMore(result.hasMore);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof Error ? error.message : "Could not load your reviews.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [filter, retryCount]);

  const loadMore = useCallback(async () => {
    setIsLoadingMore(true);
    setMoreError(null);
    try {
      const result = await fetchReviews(filter, page + 1);
      setReviews((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...result.data.filter((item) => !seen.has(item.id))];
      });
      setStats(result.stats);
      setTotal(result.total);
      setPage(result.page);
      setHasMore(result.hasMore);
    } catch (error) {
      setMoreError(
        error instanceof Error ? error.message : "Could not load more reviews.",
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [filter, page]);

  const saveReply = useCallback<ReplyAction>(async (reviewId, text) => {
    try {
      const response = await fetch(
        `/api/reviews/${encodeURIComponent(reviewId)}/reply`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ownerReply: text }),
        },
      );
      const payload: unknown = await response.json().catch(() => null);
      const saved = response.ok ? parseSavedReply(payload) : null;
      if (!saved) {
        return readReviewsError(payload, "We couldn't save your reply. Please try again.");
      }
      let wasNew = false;
      setReviews((current) =>
        current.map((item) => {
          if (item.id !== reviewId) return item;
          wasNew = item.ownerReply === null;
          return { ...item, ownerReply: saved.ownerReply, repliedAt: saved.repliedAt };
        }),
      );
      if (wasNew) setStats((current) => (current ? withReplyCountChange(current, 1) : current));
      return null;
    } catch {
      return "We couldn't save your reply. Please try again.";
    }
  }, []);

  const removeReply = useCallback<RemoveReplyAction>(async (reviewId) => {
    try {
      const response = await fetch(
        `/api/reviews/${encodeURIComponent(reviewId)}/reply`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);
        return readReviewsError(payload, "We couldn't delete your reply. Please try again.");
      }
      let hadReply = false;
      setReviews((current) =>
        current.map((item) => {
          if (item.id !== reviewId) return item;
          hadReply = item.ownerReply !== null;
          return { ...item, ownerReply: null, repliedAt: null };
        }),
      );
      if (hadReply) setStats((current) => (current ? withReplyCountChange(current, -1) : current));
      return null;
    } catch {
      return "We couldn't delete your reply. Please try again.";
    }
  }, []);

  return (
    <OwnerReviewsContent
      filter={filter}
      hasMore={hasMore}
      isLoading={isLoading}
      isLoadingMore={isLoadingMore}
      loadError={loadError}
      moreError={moreError}
      onFilterChange={setFilter}
      onLoadMore={() => void loadMore()}
      onRemoveReply={removeReply}
      onRetry={() => setRetryCount((count) => count + 1)}
      onSaveReply={saveReply}
      reviews={reviews}
      stats={stats}
      total={total}
    />
  );
}
