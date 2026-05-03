"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Edit2, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDate, getInitials, cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
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
  const router = useRouter();
  const { data: session } = useSession();
  const [showAll, setShowAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const displayed = showAll ? reviews : reviews.slice(0, 4);

  async function handleDeleteReview(reviewId: string) {
    setDeletingId(reviewId);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Failed to delete review");
      }
      toast.success("Review deleted.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setDeletingId(null);
    }
  }

  // Compute sub-rating averages
  const avgCleanliness = reviews.length
    ? reviews.reduce((s, r) => s + (r.cleanliness ?? 0), 0) / (reviews.filter((r) => r.cleanliness).length || 1)
    : 0;
  const avgLocation = reviews.length
    ? reviews.reduce((s, r) => s + (r.location ?? 0), 0) / (reviews.filter((r) => r.location).length || 1)
    : 0;
  const avgValue = reviews.length
    ? reviews.reduce((s, r) => s + (r.value ?? 0), 0) / (reviews.filter((r) => r.value).length || 1)
    : 0;
  const avgSafety = reviews.length
    ? reviews.reduce((s, r) => s + (r.safety ?? 0), 0) / (reviews.filter((r) => r.safety).length || 1)
    : 0;

  return (
    <section>
      <div className="flex items-center justify-between mb-8">
        <h2
          className="text-2xl font-bold text-[var(--color-ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Reviews
          {reviewCount > 0 && (
            <span className="ml-3 text-lg font-normal text-[var(--color-ink-muted)]">
              {reviewCount}
            </span>
          )}
        </h2>
      </div>

      {reviewCount === 0 ? (
        <div className="py-12 text-center rounded-xl border border-[var(--color-border)] bg-[var(--color-ground)]">
          <p className="text-base text-[var(--color-ink-muted)]">No reviews yet. Be the first to leave one.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Summary */}
          <div className="flex flex-col sm:flex-row gap-8 p-6 rounded-xl bg-[var(--color-brand-50)] border border-[var(--color-brand-100)]">
            <div className="text-center sm:text-left">
              <p
                className="text-6xl font-bold text-[var(--color-brand-700)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {rating.toFixed(1)}
              </p>
              <StarRow value={rating} />
              <p className="text-sm text-[var(--color-ink-muted)] mt-2">
                {reviewCount} review{reviewCount !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex-1 space-y-3">
              <RatingBar label="Cleanliness" value={Math.round(avgCleanliness)} />
              <RatingBar label="Location" value={Math.round(avgLocation)} />
              <RatingBar label="Value" value={Math.round(avgValue)} />
              <RatingBar label="Safety" value={Math.round(avgSafety)} />
            </div>
          </div>

          {/* Review cards */}
          <div className="space-y-6">
            {displayed.map((review) => {
              const isAuthor = session?.user?.id === review.userId;
              return (
              <div key={review.id} className="border-b border-[var(--color-border)] pb-6 last:border-0">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0 w-11 h-11 rounded-full bg-[var(--color-brand-600)] text-white flex items-center justify-center text-sm font-semibold overflow-hidden">
                    {review.user.avatar ? (
                      <Image
                        src={review.user.avatar}
                        alt={review.user.name}
                        width={44}
                        height={44}
                        className="object-cover"
                      />
                    ) : (
                      getInitials(review.user.name)
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="text-base font-semibold text-[var(--color-ink)]">
                          {review.user.name}
                        </p>
                        <p className="text-sm text-[var(--color-ink-muted)]">
                          {formatDate(review.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StarRow value={review.rating} />
                        {isAuthor && (
                          <div className="flex gap-1 ml-2">
                            <button
                              onClick={() => router.push(`/bookings/${review.id}/edit-review`)}
                              aria-label="Edit review"
                              className="p-2 text-[var(--color-ink-muted)] hover:text-[var(--color-brand-600)] hover:bg-[var(--color-brand-50)] rounded transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteReview(review.id)}
                              disabled={deletingId === review.id}
                              aria-label="Delete review"
                              className="p-2 text-[var(--color-ink-muted)] hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                            >
                              {deletingId === review.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {review.title && (
                      <p className="mt-3 text-base font-semibold text-[var(--color-ink)]">
                        {review.title}
                      </p>
                    )}
                    <p className="mt-2 text-base text-[var(--color-ink-soft)] leading-relaxed">
                      {review.comment}
                    </p>

                    {/* Owner reply */}
                    {review.ownerReply && (
                      <div className="mt-4 ml-4 p-4 rounded-lg bg-[var(--color-ground)] border border-[var(--color-border)]">
                        <p className="text-sm font-semibold text-[var(--color-brand-700)] mb-1.5">
                          Owner replied:
                        </p>
                        <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed">
                          {review.ownerReply}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              );
            })}
          </div>

          {reviews.length > 4 && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="text-base font-semibold text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] transition-colors"
            >
              {showAll ? "← Show fewer reviews" : `View all ${reviews.length} reviews →`}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
