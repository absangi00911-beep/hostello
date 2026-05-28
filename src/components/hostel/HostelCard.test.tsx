import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { HostelCard, type HostelCardData } from "@/components/hostel/HostelCard";

vi.mock("@/components/hostel/ShareButton", () => ({
  ShareButton: () => <button>Share</button>,
}));

const hostel: HostelCardData = {
  id: "h1",
  name: "North Campus Hostel",
  slug: "north-campus-hostel",
  city: "Lahore",
  area: "Gulberg",
  pricePerMonth: 25000,
  gender: "FEMALE",
  amenities: ["WiFi", "Laundry"],
  coverImage: null,
  images: [],
  verified: true,
  featured: false,
  rating: 4.4,
  reviewCount: 12,
  safetyScore: 4.7,
  capacity: 30,
  rooms: 5,
  owner: { id: "owner-1", name: "Owner" },
};

describe("HostelCard", () => {
  it("renders price, verification, reviews, and safety as scannable trust signals", () => {
    const markup = renderToStaticMarkup(<HostelCard hostel={hostel} />);

    expect(markup).toContain("PKR 25,000");
    expect(markup).toContain("Verified");
    expect(markup).toContain("12 reviews");
    expect(markup).toContain("Safety 4.7");
  });

  it("keeps compact cards focused on name, location, and price", () => {
    const markup = renderToStaticMarkup(<HostelCard hostel={hostel} compact />);

    expect(markup).toContain("North Campus Hostel");
    expect(markup).toContain("Lahore");
    expect(markup).toContain("PKR 25,000");
  });
});
