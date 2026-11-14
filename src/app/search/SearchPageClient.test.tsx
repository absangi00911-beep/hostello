import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { SiteFooter } from "@/components/layout/SiteFooter";
import SearchPageClient from "./SearchPageClient";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("@/components/auth/BrowseAccountActions", () => ({
  BrowseAccountActions: () => null,
}));

describe("SearchPageClient footer", () => {
  it("keeps the search navigation and relies on the canonical footer copyright", () => {
    const markup = renderToStaticMarkup(
      <>
        <SearchPageClient
          accountUser={null}
          initialQuery=""
          initialCity=""
          initialNearby={false}
          initialNearbyCoordinates={null}
          initialMoveInDate=""
          initialCheckOut=""
          initialGuests={1}
          initialFilters={{
            gender: "",
            minPrice: "",
            maxPrice: "",
            amenities: [],
            verified: false,
            sort: "newest",
          }}
          initialPage={1}
        />
        <SiteFooter />
      </>,
    );

    expect(markup).toContain("Support");
    expect(markup).toContain("For students");
    expect(markup).toContain("For hostel owners");
    expect(markup).toContain('href="/messages"');
    expect(markup).toContain('href="/search"');
    expect(markup).toContain('href="/signup?role=OWNER"');
    expect(markup).toContain('href="/terms"');
    expect(markup).toContain('href="/privacy"');
    expect(markup).toContain('href="/contact"');
    expect(markup).toContain("Made for student stays in Pakistan");
    expect(markup.match(/© \d{4} HostelLo/g)).toHaveLength(1);
  });

  it("puts server-rendered results in the HTML, so crawlers and slow phones see listings immediately", () => {
    const markup = renderToStaticMarkup(
      <SearchPageClient
        accountUser={null}
        initialQuery=""
        initialCity="Lahore"
        initialNearby={false}
        initialNearbyCoordinates={null}
        initialMoveInDate=""
        initialCheckOut=""
        initialGuests={1}
        initialFilters={{ gender: "", minPrice: "", maxPrice: "", amenities: [], verified: false, sort: "newest" }}
        initialPage={1}
        initialResults={{
          hostels: [
            { id: "h1", name: "Green View Hostel", city: "Lahore", area: "Gulberg", pricePerMonth: 12000, coverImage: null, images: [], rating: 4.5, reviewCount: 3 },
          ],
          total: 1,
        }}
      />,
    );

    expect(markup).toContain("Green View Hostel");
    expect(markup).toContain("Gulberg");
  });

  it("renders no listings until the browser loads them when there are no server results", () => {
    const markup = renderToStaticMarkup(
      <SearchPageClient
        accountUser={null}
        initialQuery=""
        initialCity="Lahore"
        initialNearby={false}
        initialNearbyCoordinates={null}
        initialMoveInDate=""
        initialCheckOut=""
        initialGuests={1}
        initialFilters={{ gender: "", minPrice: "", maxPrice: "", amenities: [], verified: false, sort: "newest" }}
        initialPage={1}
      />,
    );

    expect(markup).not.toContain("Green View Hostel");
  });
});
