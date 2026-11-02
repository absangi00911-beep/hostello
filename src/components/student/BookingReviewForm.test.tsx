import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BookingReviewForm, validateReview } from "./BookingReviewForm";

describe("validateReview", () => {
  it("requires a rating from 1 to 5", () => {
    expect(validateReview({ rating: 0, comment: "x".repeat(30) })).toMatch(/rating/);
    expect(validateReview({ rating: 6, comment: "x".repeat(30) })).toMatch(/rating/);
  });

  it("requires a comment between 20 and 1000 characters", () => {
    expect(validateReview({ rating: 5, comment: "too short" })).toMatch(/20/);
    expect(validateReview({ rating: 5, comment: "x".repeat(1001) })).toMatch(/1,000/);
    expect(validateReview({ rating: 5, comment: "x".repeat(30) })).toBeNull();
  });
});

describe("BookingReviewForm", () => {
  it("renders rating, detail and comment fields", () => {
    const markup = renderToStaticMarkup(
      <BookingReviewForm hostelId="h1" hostelName="Gulberg Stay" />,
    );

    expect(markup).toContain("Review your stay");
    expect(markup).toContain("Overall rating");
    expect(markup).toContain("Cleanliness");
    expect(markup).toContain("Submit review");
  });
});
