import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  OwnerReviewsContent,
  type OwnerReviewsContentProps,
} from "./OwnerReviewsPage";
import type { OwnerReview } from "./ownerReviews";

const review = (overrides: Partial<OwnerReview> = {}): OwnerReview => ({
  id: "r1",
  rating: 4,
  title: "Great stay",
  comment: "Clean rooms and friendly staff.",
  reviewerName: "Ali",
  hostelName: "Green Hostel",
  hostelSlug: "green-hostel",
  createdAt: "2026-10-20T09:00:00.000Z",
  ownerReply: null,
  repliedAt: null,
  stay: { checkIn: "2026-09-01T00:00:00.000Z", checkOut: "2026-10-01T00:00:00.000Z" },
  ...overrides,
});

const base: OwnerReviewsContentProps = {
  filter: "all",
  reviews: [],
  stats: { total: 4, avgRating: 4.25, responseRate: 50, repliedCount: 2 },
  total: 0,
  hasMore: false,
  isLoading: false,
  isLoadingMore: false,
  loadError: null,
  moreError: null,
  onFilterChange: vi.fn(),
  onRetry: vi.fn(),
  onLoadMore: vi.fn(),
  onSaveReply: vi.fn(),
  onRemoveReply: vi.fn(),
};

const render = (overrides: Partial<OwnerReviewsContentProps> = {}) =>
  renderToStaticMarkup(<OwnerReviewsContent {...base} {...overrides} />);

describe("OwnerReviewsContent", () => {
  it("shows stats and filters, with the active filter pressed", () => {
    const markup = render({ filter: "pending" });
    expect(markup).toContain("Average rating");
    expect(markup).toContain("4.3");
    expect(markup).toContain("50%");
    expect(markup).toContain("Needs reply");
    expect(markup).toContain("Low rated");
    expect(markup).toMatch(/aria-pressed="true"[^>]*>Needs reply/);
  });

  it("shows loading, error and empty states", () => {
    expect(render({ isLoading: true })).toContain("Loading reviews...");
    const error = render({ loadError: "Forbidden" });
    expect(error).toContain("Forbidden");
    expect(error).toContain("Try again");
    expect(render()).toContain("No reviews yet.");
    expect(render({ filter: "replied" })).toContain("No reviews match this filter.");
  });

  it("shows a review that still needs a reply", () => {
    const markup = render({ reviews: [review()], total: 1 });
    expect(markup).toContain("Ali");
    expect(markup).toContain("Green Hostel");
    expect(markup).toContain("Great stay");
    expect(markup).toContain("Clean rooms and friendly staff.");
    expect(markup).toContain("1 review");
    expect(markup).toContain(">Reply<");
    expect(markup).not.toContain("Edit reply");
  });

  it("shows an existing reply with edit and delete actions", () => {
    const markup = render({
      reviews: [
        review({
          ownerReply: "Thanks for staying with us!",
          repliedAt: "2026-10-21T09:00:00.000Z",
        }),
      ],
      total: 1,
    });
    expect(markup).toContain("Thanks for staying with us!");
    expect(markup).toContain("Edit reply");
    expect(markup).toContain("Delete reply");
  });

  it("offers load more when there are further pages", () => {
    expect(render({ reviews: [review()], total: 30, hasMore: true })).toContain("Load more");
  });
});
