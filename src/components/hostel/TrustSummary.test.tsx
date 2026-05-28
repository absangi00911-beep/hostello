import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TrustSummary } from "@/components/hostel/TrustSummary";

describe("TrustSummary", () => {
  it("summarizes verification, reviews, owner, rooms, and location", () => {
    const markup = renderToStaticMarkup(
      <TrustSummary
        verified
        reviewCount={18}
        rating={4.6}
        safetyScore={4.8}
        ownerName="Ayesha Khan"
        ownerListingCount={3}
        availableRooms={2}
        hasLocation
      />,
    );

    expect(markup).toContain("Verified listing");
    expect(markup).toContain("4.6 from 18 reviews");
    expect(markup).toContain("Safety 4.8");
    expect(markup).toContain("Ayesha Khan");
    expect(markup).toContain("2 rooms available");
    expect(markup).toContain("Map location added");
  });

  it("uses honest missing-state copy", () => {
    const markup = renderToStaticMarkup(
      <TrustSummary
        verified={false}
        reviewCount={0}
        rating={0}
        safetyScore={null}
        ownerName="Owner"
        ownerListingCount={1}
        availableRooms={0}
        hasLocation={false}
      />,
    );

    expect(markup).toContain("Verification pending");
    expect(markup).toContain("No verified reviews yet");
    expect(markup).toContain("Ask owner for availability");
    expect(markup).toContain("Address only");
  });
});
