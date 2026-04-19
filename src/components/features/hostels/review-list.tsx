"use client";

import Image from "next/image";
import { useState } from "react";
import { Star } from "lucide-react";
import { formatDate, getInitials, cn } from "@/lib/utils";
import type { ReviewWithUser } from "@/types";

interface ReviewListProps {
  reviews: ReviewWithUser[];
  rating: number;
  reviewCount: number;
  hostelId: string;
}

function StarRow({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "w-3.5 h-3.5",
            i < Math.round(value)
              ? "text-[var(--color-accent-500)] fill-current"
              : "text-[var(--color-sand-200)]"
          )}
        />
      ))}
    </div>
  );
}

function RatingBar({ label, value }: { label: string; value: number }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[var(--color-muted)] w-20 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-[var(--color-sand-100)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--color-accent-500)] transition-all"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
      <span className="text-xs font-medium text-[var(--color-text)] w-6 text-right">{value}</span>
    </div>
  );
}

export function ReviewList({ reviews, rating, reviewCount, hostelId: _hostelId }: ReviewListProps) {
  const [showAll, setShowAll] = useState(false);

  const displayed = showAll ? reviews : reviews.slice(0, 4);

  // Compute sub-rating averages
  const avgCleanliness = reviews.length
    ? reviews.reduce((s, r) => s + (r.cleanliness ?? 0), 0) / reviews.filter((r) => r.cleanliness).length || 0
    : 0;
  const avgLocation = reviews.length
    ? reviews.reduce((s, r) => s + (r.location ?? 0), 0) / reviews.filter((r) => r.location).length || 0
    : 0;
  const avgValue = reviews.length
    ? reviews.reduce((s, r) => s + (r.value ?? 0), 0) / reviews.filter((r) => r.value).length || 0
    : 0;
  const avgSafety = reviews.length
    ? reviews.reduce((s, r) => s + (r.safety ?? 0), 0) / reviews.filter((r) => r.safety).length || 0
    : 0;

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2
          className="text-xl font-bold text-[var(--color-text)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Reviews
          {reviewCount > 0 && (
            <span className="ml-2 text-base font-normal text-[var(--color-muted)]">
              ({reviewCount})
            </span>
          )}
        </h2>
      </div>

      {reviewCount === 0 ? (
        <div className="py-10 text-center rounded-xl border border-[var(--color-border)] bg-[var(--color-sand-50)]">
          <p className="text-sm text-[var(--color-muted)]">No reviews yet. Be the first to leave one.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Summary */}
          <div className="flex flex-col sm:flex-row gap-8 p-5 rounded-xl bg-[var(--color-sand-50)] border border-[var(--color-border)]">
            <div className="text-center sm:text-left">
              <p
                className="text-5xl font-bold text-[var(--color-text)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {rating.toFixed(1)}
              </p>
              <StarRow value={rating} />
              <p className="text-xs text-[var(--color-muted)] mt-1">
                {reviewCount} review{reviewCount !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex-1 space-y-2.5">
              <RatingBar label="Cleanliness" value={Math.round(avgCleanliness)} />
              <RatingBar label="Location" value={Math.round(avgLocation)} />
              <RatingBar label="Value" value={Math.round(avgValue)} />
              <RatingBar label="Safety" value={Math.round(avgSafety)} />
            </div>
          </div>

          {/* Review cards */}
          <div className="space-y-5">
            {displayed.map((review) => (
              <div key={review.id} className="border-b border-[var(--color-border)] pb-5 last:border-0">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[var(--color-primary-900)] text-white flex items-center justify-center text-sm font-semibold overflow-hidden">
                    {review.user.avatar ? (
                      <Image
                        src={review.user.avatar}
                        alt={review.user.name}
                        width={36}
                        height={36}
                        className="object-cover"
                      />
                    ) : (
                      getInitials(review.user.name)
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-text)]">
                          {review.user.name}
                        </p>
                        <p className="text-xs text-[var(--color-muted)]">
                          {formatDate(review.createdAt)}
                        </p>
                      </div>
                      <StarRow value={review.rating} />
                    </div>

                    {review.title && (
                      <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">
                        {review.title}
                      </p>
                    )}
                    <p className="mt-1.5 text-sm text-[var(--color-text)] leading-relaxed">
                      {review.comment}
                    </p>

                    {/* Owner reply */}
                    {review.ownerReply && (
                      <div className="mt-3 ml-4 p-3 rounded-lg bg-[var(--color-sand-50)] border border-[var(--color-border)]">
                        <p className="text-xs font-semibold text-[var(--color-primary-700)] mb-1">
                          Owner replied:
                        </p>
                        <p className="text-xs text-[var(--color-text)] leading-relaxed">
                          {review.ownerReply}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {reviews.length > 4 && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="text-sm font-medium text-[var(--color-primary-700)] hover:underline"
            >
              {showAll ? "Show fewer reviews" : `Show all ${reviews.length} reviews`}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
