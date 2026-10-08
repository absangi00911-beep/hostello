import { describe, expect, it } from "vitest";
import type { HostelCardData } from "./HostelCard";
import { buildPopupHtml } from "./SearchMap";

function makeHostel(overrides: Partial<HostelCardData> = {}): HostelCardData {
  return {
    id: "hostel_1",
    name: "Garden Hostel",
    slug: "garden-hostel",
    city: "Lahore",
    area: "Gulberg",
    address: "1 Garden Road, Lahore",
    pricePerMonth: 25_000,
    coverImage: "https://images.example/cover.jpg",
    images: [],
    rating: 4.5,
    reviewCount: 2,
    verified: true,
    latitude: 31.52,
    longitude: 74.35,
    gender: "MIXED",
    amenities: [],
    ...overrides,
  };
}

describe("SearchMap popup HTML", () => {
  it("escapes untrusted names and image attributes and encodes the hostel slug", () => {
    const html = buildPopupHtml(makeHostel({
      name: 'Hostel " onmouseover="alert(1)<script>alert(1)</script>',
      slug: 'x"><img src=x onerror=alert(1)>',
      coverImage: 'https://images.example/cover.jpg" onerror="alert(1)',
    }));

    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&quot; onerror=&quot;");
    expect(html).not.toMatch(/<script|<img src=x onerror/i);
    expect(html).toContain(encodeURIComponent('x"><img src=x onerror=alert(1)>'));
  });

  it("omits image URLs that are not HTTPS or root-relative", () => {
    const html = buildPopupHtml(makeHostel({ coverImage: "javascript:alert(1)" }));

    expect(html).not.toContain("<img");
  });
});
