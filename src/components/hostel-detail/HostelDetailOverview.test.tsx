import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HostelDetailOverview } from "./HostelDetailOverview";

const baseProps = {
  area: "Sariab Road",
  capacity: 60,
  city: "Quetta",
  description: "A welcoming hostel close to campus.",
  genderLabel: "Men’s hostel",
  rating: 4.8,
  reviewCount: 18,
  rooms: 20,
  verified: true,
};

describe("HostelDetailOverview", () => {
  it("shows accurate listing location, capacity, room count, and listing trust facts", () => {
    const markup = renderToStaticMarkup(
      <HostelDetailOverview {...baseProps} />,
    );

    expect(markup).toContain("Men’s hostel in Quetta");
    expect(markup).toContain("Sariab Road");
    expect(markup).toContain("Up to 60 residents");
    expect(markup).toContain("20 rooms");
    expect(markup).toContain("4.8");
    expect(markup).toContain("18 reviews");
    expect(markup).toContain("Verified hostel");
    expect(markup).toContain("A welcoming hostel close to campus.");
    expect(markup).not.toContain("Guest favorite");
    expect(markup).not.toContain("Host rating");
  });

  it("omits rating and verification claims for an unreviewed, unverified listing", () => {
    const markup = renderToStaticMarkup(
      <HostelDetailOverview
        {...baseProps}
        area={null}
        rating={4.8}
        reviewCount={0}
        verified={false}
      />,
    );

    expect(markup).toContain("New listing");
    expect(markup).not.toContain("4.8");
    expect(markup).not.toContain("Verified hostel");
    expect(markup).not.toContain("Guest favorite");
    expect(markup).toContain("A welcoming hostel close to campus.");
  });
});
