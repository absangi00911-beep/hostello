import Image from "next/image";
import { CheckCircle2, Star } from "lucide-react";

interface HostelReview {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  ownerReply: string | null;
  createdAt: Date;
  verified: boolean;
  user: { name: string | null; avatar: string | null };
}

interface ReviewCategoryRatings {
  cleanliness: number | null;
  location: number | null;
  value: number | null;
  safety: number | null;
}

interface HostelReviewsSectionProps {
  rating: number;
  reviewCount: number;
  reviews: HostelReview[];
  reviewCategoryRatings: ReviewCategoryRatings | null;
}

const reviewCategories = [
  { key: "cleanliness", label: "Cleanliness" },
  { key: "location", label: "Location" },
  { key: "value", label: "Value" },
  { key: "safety", label: "Safety" },
] as const;

function getReviewerInitials(name: string | null): string {
  const initials = name
    ?.trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "G";
}

function formatReviewDate(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function HostelReviewsSection({
  rating,
  reviewCount,
  reviews,
  reviewCategoryRatings,
}: HostelReviewsSectionProps) {
  const categories = reviewCategories.flatMap(({ key, label }) => {
    const score = reviewCategoryRatings?.[key];
    return typeof score === "number" && score > 0
      ? [{ key, label, score }]
      : [];
  });

  return (
    <section
      aria-labelledby="hostel-reviews-title"
      className="hostel-reviews-section border-t border-line pt-5"
      role="region"
    >
      <div className="hostel-reviews-heading mb-4 flex items-center justify-between gap-4">
        <h2 id="hostel-reviews-title" className="m-0 text-[1.25rem] font-semibold tracking-[-0.02em] text-ink">
          Reviews
        </h2>
        {reviewCount > 0 && (
          <p className="hostel-reviews-overall-rating m-0 flex items-center gap-1.5 text-[0.9rem] text-ink">
            <Star aria-hidden="true" className="text-brand-dark" fill="currentColor" size={18} />
            <strong>{rating.toFixed(1)}</strong>
            <span aria-label={`${reviewCount} reviews`}>
              · {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
            </span>
          </p>
        )}
      </div>

      {categories.length > 0 && (
        <div className="hostel-review-categories border-b border-line pb-5">
          <h3 className="hostel-review-categories-title mb-3 text-base font-semibold text-ink">
            Category ratings
          </h3>
          <ul className="hostel-review-category-list m-0 grid list-none gap-x-6 gap-y-4 p-0 [grid-template-columns:repeat(2,minmax(0,1fr))] max-md:[grid-template-columns:1fr]">
            {categories.map(({ key, label, score }) => (
              <li className="hostel-review-category" key={key}>
                <div className="hostel-review-category-label mb-2 flex justify-between gap-3 text-[0.875rem] text-ink">
                  <span>{label}</span>
                  <span className="font-[650] [font-variant-numeric:tabular-nums]">{score.toFixed(1)}</span>
                </div>
                <div
                  aria-label={`${label} rating`}
                  aria-valuemax={5}
                  aria-valuemin={0}
                  aria-valuenow={score}
                  className="hostel-review-category-meter h-1 overflow-hidden rounded-[4px] bg-surface-muted"
                  role="meter"
                >
                  <span className="block h-full rounded-[inherit] bg-ink" style={{ width: `${Math.min(score, 5) * 20}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {reviews.length > 0 ? (
        <ul className="hostel-review-list m-0 grid list-none gap-x-7 gap-y-5 pt-5 [grid-template-columns:repeat(2,minmax(0,1fr))] max-md:[grid-template-columns:1fr]">
          {reviews.map((review) => {
            const reviewerName = review.user.name?.trim() || "Guest";

            return (
              <li className="hostel-review min-w-0" key={review.id}>
                <div className="hostel-review-author mb-3 flex items-center gap-3">
                  {review.user.avatar ? (
                    <Image
                      alt=""
                      className="hostel-review-avatar h-10 w-10 flex-none rounded-full object-cover"
                      height={40}
                      src={review.user.avatar}
                      unoptimized
                      width={40}
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="hostel-review-avatar grid h-10 w-10 flex-none place-items-center rounded-full bg-surface-muted text-[0.8rem] font-bold text-ink"
                    >
                      {getReviewerInitials(review.user.name)}
                    </span>
                  )}
                  <div>
                    <p className="hostel-review-author-name m-0 text-[0.9rem] font-bold text-ink">
                      {reviewerName}
                    </p>
                    <p className="hostel-review-meta mt-0.5 flex flex-wrap items-center gap-2 text-[0.8rem] text-muted">
                      {formatReviewDate(review.createdAt)}
                      {review.verified && (
                        <span className="hostel-review-verified inline-flex items-center gap-1">
                          <CheckCircle2 aria-hidden="true" size={14} />
                          Verified stay
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <p className="hostel-review-rating mb-2 flex items-center gap-1.5 text-[0.8rem] font-bold text-ink">
                  <span aria-label={`${review.rating} out of 5 stars`} className="inline-flex items-center gap-1.5" role="img">
                    <Star aria-hidden="true" className="text-brand-dark" fill="currentColor" size={14} />
                    {review.rating}
                  </span>
                </p>
                {review.title && (
                  <h3 className="hostel-review-title mb-1.5 text-[0.95rem] font-bold leading-[1.45] text-ink">
                    {review.title}
                  </h3>
                )}
                <p className="hostel-review-comment m-0 text-[0.875rem] leading-[1.6] text-ink [overflow-wrap:anywhere]">
                  {review.comment}
                </p>
                {review.ownerReply && (
                  <div className="hostel-review-owner-reply mt-3.5 rounded-r-lg border-l-2 border-line bg-surface-muted px-3.5 py-3">
                    <p className="hostel-review-owner-label m-0 mb-1 text-[0.8rem] font-bold text-ink">
                      Host reply
                    </p>
                    <p className="m-0 text-[0.875rem] leading-[1.6] text-ink [overflow-wrap:anywhere]">
                      {review.ownerReply}
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="hostel-reviews-empty m-0 text-[0.9rem] leading-[1.5] text-muted" role="status">
          No written reviews yet.
        </p>
      )}
    </section>
  );
}
