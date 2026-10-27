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
      className="hostel-reviews-section"
      role="region"
    >
      <div className="hostel-reviews-heading">
        <h2 id="hostel-reviews-title">Reviews</h2>
        {reviewCount > 0 && (
          <p className="hostel-reviews-overall-rating">
            <Star aria-hidden="true" fill="currentColor" size={18} />
            <strong>{rating.toFixed(1)}</strong>
            <span aria-label={`${reviewCount} reviews`}>
              · {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
            </span>
          </p>
        )}
      </div>

      {categories.length > 0 && (
        <div className="hostel-review-categories">
          <h3 className="hostel-review-categories-title">Category ratings</h3>
          <ul className="hostel-review-category-list">
            {categories.map(({ key, label, score }) => (
              <li className="hostel-review-category" key={key}>
                <div className="hostel-review-category-label">
                  <span>{label}</span>
                  <span>{score.toFixed(1)}</span>
                </div>
                <div
                  aria-label={`${label} rating`}
                  aria-valuemax={5}
                  aria-valuemin={0}
                  aria-valuenow={score}
                  className="hostel-review-category-meter"
                  role="meter"
                >
                  <span style={{ width: `${Math.min(score, 5) * 20}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {reviews.length > 0 ? (
        <ul className="hostel-review-list">
          {reviews.map((review) => {
            const reviewerName = review.user.name?.trim() || "Guest";

            return (
              <li
                className="hostel-review"
                key={review.id}
              >
                <div className="hostel-review-author">
                  {review.user.avatar ? (
                    <Image
                      alt=""
                      className="hostel-review-avatar"
                      height={40}
                      src={review.user.avatar}
                      unoptimized
                      width={40}
                    />
                  ) : (
                    <span aria-hidden="true" className="hostel-review-avatar">
                      {getReviewerInitials(review.user.name)}
                    </span>
                  )}
                  <div>
                    <p className="hostel-review-author-name">{reviewerName}</p>
                    <p className="hostel-review-meta">
                      {formatReviewDate(review.createdAt)}
                      {review.verified && (
                        <span className="hostel-review-verified">
                          <CheckCircle2 aria-hidden="true" size={14} />
                          Verified stay
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <p className="hostel-review-rating">
                  <span
                    aria-label={`${review.rating} out of 5 stars`}
                    role="img"
                  >
                    <Star aria-hidden="true" fill="currentColor" size={14} />
                    {review.rating}
                  </span>
                </p>
                {review.title && (
                  <h3 className="hostel-review-title">{review.title}</h3>
                )}
                <p className="hostel-review-comment">{review.comment}</p>
                {review.ownerReply && (
                  <div className="hostel-review-owner-reply">
                    <p className="hostel-review-owner-label">Host reply</p>
                    <p>{review.ownerReply}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="hostel-reviews-empty" role="status">
          No written reviews yet.
        </p>
      )}
    </section>
  );
}
