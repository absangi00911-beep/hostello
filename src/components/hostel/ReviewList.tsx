// Path: src/components/hostel/ReviewList.tsx
import { Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ReviewUser {
  id: string;
  name: string;
  avatar?: string | null;
}

export interface ReviewData {
  id: string;
  rating: number;
  title?: string | null;
  comment: string;
  cleanliness: number;
  location: number;
  value: number;
  safety: number;
  ownerReply?: string | null;
  repliedAt?: string | null;
  verified: boolean;
  createdAt: string;
  user: ReviewUser;
}

interface ReviewListProps {
  reviews: ReviewData[];
  overallRating: number;
  reviewCount: number;
}

/* -- Score bar --------------------------------------------- */
function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct = (score / 5) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[var(--text-body-sm)] text-[var(--color-text-muted)] w-24 shrink-0">
        {label}
      </span>
      <div
        className="flex-1 h-1.5 rounded-full bg-[var(--color-bg-sidebar)] overflow-hidden"
        role="meter"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={5}
        aria-label={`${label}: ${score} out of 5`}
      >
        <div
          className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-[var(--transition-slow)]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[var(--text-body-sm)] font-[500] text-[var(--color-text-body)] w-6 text-right shrink-0">
        {score > 0 ? score.toFixed(1) : "–"}
      </span>
    </div>
  );
}

/* -- User avatar ------------------------------------------- */
function Avatar({ user, size = 36 }: { user: ReviewUser; size?: number }) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className="shrink-0 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center overflow-hidden"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {user.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.avatar}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <span
          className="text-[var(--color-primary-deep)] font-[600] select-none"
          style={{ fontSize: size * 0.38 }}
        >
          {initials}
        </span>
      )}
    </div>
  );
}

/* -- Single review card ------------------------------------ */
function ReviewCard({ review }: { review: ReviewData }) {
  const timeAgo = formatDistanceToNow(new Date(review.createdAt), {
    addSuffix: true,
  });

  return (
    <article className="py-5 border-b border-[var(--color-border-subtle)] last:border-b-0">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <Avatar user={review.user} />
        <div className="min-w-0 flex-1">
          <p className="text-[var(--text-body-sm)] font-[500] text-[var(--color-text-heading)] truncate">
            {review.user.name}
          </p>
          <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">
            {timeAgo}
          </p>
        </div>
        {/* Rating — one star + number only */}
        <div className="flex items-center gap-1 shrink-0">
          <Star
            size={13}
            strokeWidth={1.5}
            className="text-[var(--color-primary)] fill-[var(--color-primary)]"
            aria-hidden="true"
          />
          <span className="text-[var(--text-body-sm)] font-[600] text-[var(--color-text-body)]">
            {review.rating}
          </span>
        </div>
      </div>

      {/* Title */}
      {review.title && (
        <p className="text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)] mb-1">
          {review.title}
        </p>
      )}

      {/* Comment */}
      <p className="text-[var(--text-body)] text-[var(--color-text-body)] leading-relaxed">
        {review.comment}
      </p>

      {/* Owner reply — indented below */}
      {review.ownerReply && (
        <div className="mt-4 ml-6 pl-4 border-l-2 border-[var(--color-border-default)]">
          <p className="text-[var(--text-caption)] font-[600] text-[var(--color-text-muted)] mb-1 uppercase tracking-wide">
            Owner reply
          </p>
          <p className="text-[var(--text-body-sm)] text-[var(--color-text-body)] leading-relaxed">
            {review.ownerReply}
          </p>
          {review.repliedAt && (
            <p className="text-[var(--text-caption)] text-[var(--color-text-muted)] mt-1">
              {formatDistanceToNow(new Date(review.repliedAt), {
                addSuffix: true,
              })}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

/* -- ReviewList -------------------------------------------- */
export function ReviewList({
  reviews,
  overallRating,
  reviewCount,
}: ReviewListProps) {
  if (reviewCount === 0) {
    return (
      <div className="py-10 text-center">
        <Star
          size={32}
          strokeWidth={1.5}
          className="text-[var(--color-text-muted)] mx-auto mb-3"
          aria-hidden="true"
        />
        <p className="text-[var(--text-body-sm)] font-[500] text-[var(--color-text-heading)] mb-1">
          No reviews yet
        </p>
        <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
          Reviews appear after a completed stay.
        </p>
      </div>
    );
  }

  // Compute aggregate subcategory averages from the fetched reviews
  const avg = (field: keyof Pick<ReviewData, "cleanliness" | "location" | "value" | "safety">) => {
    const vals = reviews.filter((r) => r[field] > 0).map((r) => r[field]);
    if (!vals.length) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };

  return (
    <div>
      {/* Aggregate block */}
      <div className="mb-6 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-sidebar)] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Overall rating — large number */}
          <div className="flex flex-col items-center justify-center shrink-0 sm:pr-5 sm:border-r sm:border-[var(--color-border-subtle)]">
            <span
              className="text-[3rem] font-[800] leading-none text-[var(--color-text-heading)]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {overallRating.toFixed(1)}
            </span>
            <div className="flex items-center gap-1 mt-1">
              <Star
                size={14}
                strokeWidth={1.5}
                className="text-[var(--color-primary)] fill-[var(--color-primary)]"
                aria-hidden="true"
              />
              <span className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
                {reviewCount} review{reviewCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Category bars */}
          <div className="flex-1 space-y-2.5">
            <ScoreBar label="Cleanliness" score={avg("cleanliness")} />
            <ScoreBar label="Location"    score={avg("location")} />
            <ScoreBar label="Value"       score={avg("value")} />
            <ScoreBar label="Safety"      score={avg("safety")} />
          </div>
        </div>
      </div>

      {/* Review list */}
      <div role="list" aria-label="Guest reviews">
        {reviews.map((review) => (
          <div key={review.id} role="listitem">
            <ReviewCard review={review} />
          </div>
        ))}
      </div>

      {reviewCount > reviews.length && (
        <p className="mt-4 text-center text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
          Showing {reviews.length} of {reviewCount} reviews.
        </p>
      )}
    </div>
  );
}
