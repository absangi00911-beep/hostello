import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { SiteFooter } from "@/components/layout/SiteFooter";
import SearchPageClient from "./SearchPageClient";
import { getPaginationPages } from "./SearchPageClient";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("@/components/auth/BrowseAccountActions", () => ({
  BrowseAccountActions: () => null,
}));

describe("SearchPageClient footer", () => {
  it("keeps the current search page in a centered pagination range", () => {
    expect(getPaginationPages(1, 12)).toEqual([1, 2, 3, 4, 5]);
    expect(getPaginationPages(6, 12)).toEqual([4, 5, 6, 7, 8]);
    expect(getPaginationPages(12, 12)).toEqual([8, 9, 10, 11, 12]);
  });
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
    expect(markup).toMatch(/<a[^>]*href="\/contact"[^>]*>Contact HostelLo<\/a>/);
    expect(markup).toContain('href="/search"');
    expect(markup).toContain('href="/signup?role=OWNER"');
    expect(markup).toContain('href="/terms"');
    expect(markup).toContain('href="/privacy"');
    expect(markup).toContain('href="/contact"');
    expect(markup).toContain("Made for student stays in Pakistan");
    expect(markup).toContain('aria-label="Main navigation"');
    expect(markup).toMatch(/<a\b(?=[^>]*aria-current="page")(?=[^>]*href="\/")[^>]*>/);
    expect(markup.match(/© \d{4} HostelLo/g)).toHaveLength(1);
    expect(markup.match(/<footer\b/g)).toHaveLength(1);
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
    expect(markup).not.toContain('aria-label="View details for Green View Hostel"');
    expect(markup).toContain("text-headline");
  });

  it("uses the standard card shape for the compact search form", () => {
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
    const compactForm = markup.match(/<form class="search-compact-form[^"]*"/)?.[0];

    expect(compactForm).toContain("rounded-xl");
    expect(compactForm).not.toContain("rounded-full");
    expect(markup).toContain(
      '<span class="text-label leading-[1.25] font-bold text-ink">Where</span>',
    );
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

describe("SearchPageClient availability alert prompt", () => {
  it("does not offer student alert management to owners or admins", () => {
    for (const role of ["OWNER", "ADMIN"] as const) {
      const markup = renderToStaticMarkup(
        <SearchPageClient
          accountUser={{ role }}
          initialQuery=""
          initialCity="Lahore"
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
        />,
      );

      expect(markup).not.toContain("Want to know when a matching hostel has space");
      expect(markup).not.toContain("Create availability alert");
    }
  });
});
