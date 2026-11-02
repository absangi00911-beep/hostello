import { describe, expect, it } from "vitest";
import {
  parseReviewsPage,
  parseSavedReply,
  readReviewsError,
  validateReply,
  withReplyCountChange,
} from "./ownerReviews";

const apiReview = {
  id: "r1",
  rating: 4,
  title: "Great stay",
  comment: "Clean rooms and friendly staff.",
  createdAt: "2026-10-20T09:00:00.000Z",
  ownerReply: null,
  repliedAt: null,
  user: { id: "u1", name: "Ali", avatar: null },
  hostel: { id: "h1", name: "Green Hostel", slug: "green-hostel" },
  stay: { checkIn: "2026-09-01T00:00:00.000Z", checkOut: "2026-10-01T00:00:00.000Z", months: 1 },
};

const stats = { total: 4, newThisWeek: 1, avgRating: 4.25, responseRate: 50, repliedCount: 2, sentiment: "Positive" };

const response = { data: [apiReview], total: 1, page: 1, limit: 20, hasMore: false, stats };

describe("parseReviewsPage", () => {
  it("accepts the /api/reviews/mine shape", () => {
    const parsed = parseReviewsPage(response);
    expect(parsed?.data[0]).toMatchObject({
      id: "r1",
      reviewerName: "Ali",
      hostelName: "Green Hostel",
      hostelSlug: "green-hostel",
      ownerReply: null,
    });
    expect(parsed?.data[0].stay?.checkIn).toBe("2026-09-01T00:00:00.000Z");
    expect(parsed?.stats.repliedCount).toBe(2);
  });

  it("allows a missing stay, title and null stats", () => {
    const parsed = parseReviewsPage({
      ...response,
      data: [{ ...apiReview, stay: null, title: null }],
      stats: { ...stats, avgRating: null, responseRate: null },
    });
    expect(parsed?.data[0].stay).toBeNull();
    expect(parsed?.data[0].title).toBeNull();
    expect(parsed?.stats.avgRating).toBeNull();
  });

  it("rejects unexpected shapes", () => {
    expect(parseReviewsPage(null)).toBeNull();
    expect(parseReviewsPage({ ...response, stats: null })).toBeNull();
    expect(parseReviewsPage({ ...response, data: [{ id: "r1" }] })).toBeNull();
  });
});

describe("parseSavedReply", () => {
  it("reads the PATCH response", () => {
    const saved = parseSavedReply({
      data: { id: "r1", ownerReply: "Thank you!", repliedAt: "2026-10-21T09:00:00.000Z" },
    });
    expect(saved).toEqual({ ownerReply: "Thank you!", repliedAt: "2026-10-21T09:00:00.000Z" });
    expect(parseSavedReply({})).toBeNull();
  });
});

describe("validateReply", () => {
  it("enforces the 10 to 1000 character limits on the trimmed text", () => {
    expect(validateReply("short")).toContain("at least 10");
    expect(validateReply("   short    ")).toContain("at least 10");
    expect(validateReply("Thanks for staying with us.")).toBeNull();
    expect(validateReply("x".repeat(1000))).toBeNull();
    expect(validateReply("x".repeat(1001))).toContain("at most 1000");
  });
});

describe("withReplyCountChange", () => {
  it("keeps the reply rate in step", () => {
    const next = withReplyCountChange(
      { total: 4, avgRating: 4, responseRate: 50, repliedCount: 2 },
      1,
    );
    expect(next.repliedCount).toBe(3);
    expect(next.responseRate).toBe(75);
  });

  it("never goes below zero", () => {
    const next = withReplyCountChange(
      { total: 4, avgRating: 4, responseRate: 0, repliedCount: 0 },
      -1,
    );
    expect(next.repliedCount).toBe(0);
    expect(next.responseRate).toBe(0);
  });
});

describe("readReviewsError", () => {
  it("uses the API message or the fallback", () => {
    expect(readReviewsError({ error: "Review not found." }, "x")).toBe("Review not found.");
    expect(readReviewsError(null, "fallback")).toBe("fallback");
  });
});
