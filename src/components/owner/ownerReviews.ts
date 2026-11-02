export type ReviewFilter = "all" | "pending" | "replied" | "flagged";

/** `flagged` is the API's name for reviews rated 2 stars or lower. */
export const REVIEW_FILTERS: ReadonlyArray<{ value: ReviewFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Needs reply" },
  { value: "replied", label: "Replied" },
  { value: "flagged", label: "Low rated" },
];

/** Same limits as `replySchema` in `src/app/api/reviews/[id]/reply/route.ts`. */
export const REPLY_MIN_LENGTH = 10;
export const REPLY_MAX_LENGTH = 1000;

export interface OwnerReview {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  reviewerName: string;
  hostelName: string;
  hostelSlug: string;
  createdAt: string;
  ownerReply: string | null;
  repliedAt: string | null;
  stay: { checkIn: string; checkOut: string } | null;
}

export interface ReviewStats {
  total: number;
  avgRating: number | null;
  responseRate: number | null;
  repliedCount: number;
}

export interface OwnerReviewsPage {
  data: OwnerReview[];
  total: number;
  page: number;
  hasMore: boolean;
  stats: ReviewStats;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidDateString(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function parseStay(value: unknown): OwnerReview["stay"] {
  if (
    !isRecord(value) ||
    !isValidDateString(value.checkIn) ||
    !isValidDateString(value.checkOut)
  ) {
    return null;
  }
  return { checkIn: value.checkIn, checkOut: value.checkOut };
}

function parseReview(value: unknown): OwnerReview | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.rating !== "number" ||
    typeof value.comment !== "string" ||
    !isValidDateString(value.createdAt) ||
    !isRecord(value.user) ||
    typeof value.user.name !== "string" ||
    !isRecord(value.hostel) ||
    typeof value.hostel.name !== "string" ||
    typeof value.hostel.slug !== "string" ||
    !(value.title == null || typeof value.title === "string") ||
    !(value.ownerReply == null || typeof value.ownerReply === "string") ||
    !(value.repliedAt == null || isValidDateString(value.repliedAt))
  ) {
    return null;
  }
  return {
    id: value.id,
    rating: value.rating,
    title: typeof value.title === "string" && value.title ? value.title : null,
    comment: value.comment,
    reviewerName: value.user.name,
    hostelName: value.hostel.name,
    hostelSlug: value.hostel.slug,
    createdAt: value.createdAt,
    ownerReply: typeof value.ownerReply === "string" ? value.ownerReply : null,
    repliedAt: typeof value.repliedAt === "string" ? value.repliedAt : null,
    stay: parseStay(value.stay),
  };
}

function parseStats(value: unknown): ReviewStats | null {
  if (
    !isRecord(value) ||
    typeof value.total !== "number" ||
    typeof value.repliedCount !== "number" ||
    !(value.avgRating === null || typeof value.avgRating === "number") ||
    !(value.responseRate === null || typeof value.responseRate === "number")
  ) {
    return null;
  }
  return {
    total: value.total,
    avgRating: value.avgRating,
    responseRate: value.responseRate,
    repliedCount: value.repliedCount,
  };
}

/** Parses `GET /api/reviews/mine`; null when the shape is unexpected. */
export function parseReviewsPage(value: unknown): OwnerReviewsPage | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.data) ||
    typeof value.total !== "number" ||
    typeof value.page !== "number" ||
    typeof value.hasMore !== "boolean"
  ) {
    return null;
  }
  const stats = parseStats(value.stats);
  if (!stats) return null;
  const data = value.data.map(parseReview);
  if (data.some((review) => review === null)) return null;
  return {
    data: data as OwnerReview[],
    total: value.total,
    page: value.page,
    hasMore: value.hasMore,
    stats,
  };
}

/** Reads `{ data: { ownerReply, repliedAt } }` from the PATCH response. */
export function parseSavedReply(
  value: unknown,
): { ownerReply: string; repliedAt: string } | null {
  if (
    !isRecord(value) ||
    !isRecord(value.data) ||
    typeof value.data.ownerReply !== "string" ||
    !isValidDateString(value.data.repliedAt)
  ) {
    return null;
  }
  return { ownerReply: value.data.ownerReply, repliedAt: value.data.repliedAt };
}

export function readReviewsError(value: unknown, fallback: string): string {
  return isRecord(value) && typeof value.error === "string"
    ? value.error
    : fallback;
}

export function validateReply(text: string): string | null {
  const length = text.trim().length;
  if (length < REPLY_MIN_LENGTH) {
    return `Write at least ${REPLY_MIN_LENGTH} characters.`;
  }
  if (length > REPLY_MAX_LENGTH) {
    return `A reply can be at most ${REPLY_MAX_LENGTH} characters.`;
  }
  return null;
}

/** Keeps the response rate in step after a reply is added or removed. */
export function withReplyCountChange(
  stats: ReviewStats,
  delta: 1 | -1,
): ReviewStats {
  const repliedCount = Math.max(0, stats.repliedCount + delta);
  return {
    ...stats,
    repliedCount,
    responseRate: stats.total > 0 ? (repliedCount / stats.total) * 100 : null,
  };
}
