import Image from "next/image";
import styles from "./recent-reviews.module.css";
import { Review, User, Hostel } from "@prisma/client";

interface RecentReviewsProps {
  reviews: (Review & { user: { name: string; avatar: string | null }; hostel: { name: string } })[];
}

export default function RecentReviews({ reviews }: RecentReviewsProps) {
  if (!reviews || reviews.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No reviews yet. Once guests stay at your hostel, they can leave reviews.</p>
      </div>
    );
  }

  return (
    <div className={styles.reviewsList}>
      {reviews.map((review) => (
        <div key={review.id} className={styles.reviewItem}>
          <div className={styles.reviewHeader}>
            <div className={styles.authorInfo}>
              {review.user.avatar ? (
                <Image
                  src={review.user.avatar}
                  alt={review.user.name}
                  className={styles.avatar}
                  width={40}
                  height={40}
                />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {review.user.name.charAt(0)}
                </div>
              )}
              <div>
                <p className={styles.authorName}>{review.user.name}</p>
                <p className={styles.hostelName}>{review.hostel.name}</p>
              </div>
            </div>
            <div className={styles.rating}>
              {"★".repeat(review.rating)}
              {"☆".repeat(5 - review.rating)}
            </div>
          </div>
          {review.title && <p className={styles.title}>{review.title}</p>}
          <p className={styles.comment}>{review.comment}</p>
          {review.ownerReply && (
            <div className={styles.reply}>
              <p className={styles.replyLabel}>Your reply:</p>
              <p className={styles.replyText}>{review.ownerReply}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
