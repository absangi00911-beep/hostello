import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HostelReviewsSection } from "./HostelReviewsSection";

const review = {
  id: "review-1",
  rating: 5,
  title: "Comfortable stay",
  comment: "The hostel was clean and welcoming.",
  ownerReply: null,
  createdAt: new Date("2026-10-26T12:00:00.000Z"),
  verified: true,
};

describe("HostelReviewsSection", () => {
  it("renders a reviewer photo when available", () => {
    const markup = renderToStaticMarkup(
      <HostelReviewsSection
        rating={5}
        reviewCount={1}
        reviews={[
          {
            ...review,
            user: {
              name: "Hamza Malik",
              avatar: "https://images.unsplash.com/hamza.jpg",
            },
          },
        ]}
        reviewCategoryRatings={null}
      />,
    );

    expect(markup).toContain('src="https://images.unsplash.com/hamza.jpg"');
    expect(markup).toContain('alt=""');
    expect(markup).not.toContain("HM</span>");
  });

  it("keeps reviewer initials when no photo is available", () => {
    const markup = renderToStaticMarkup(
      <HostelReviewsSection
        rating={5}
        reviewCount={1}
        reviews={[{ ...review, user: { name: "Hamza Malik", avatar: null } }]}
        reviewCategoryRatings={null}
      />,
    );

    expect(markup).toContain("HM</span>");
  });
});
