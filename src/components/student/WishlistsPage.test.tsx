import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  WishlistsPage,
  WishlistsPageContent,
} from "./WishlistsPage";

describe("WishlistsPage", () => {
  it("renders an accessible initial loading state", () => {
    const markup = renderToStaticMarkup(<WishlistsPage />);

    expect(markup).toContain("Loading saved hostels");
    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-busy="true"');
  });

  it("renders an empty state that links back to Explore", () => {
    const markup = renderToStaticMarkup(
      <WishlistsPageContent
        error={null}
        hasMore={false}
        hostels={[]}
        isLoading={false}
        isLoadingMore={false}
        onLoadMore={() => {}}
        onRetry={() => {}}
      />,
    );

    expect(markup).toContain("No saved hostels yet");
    expect(markup).toContain('href="/"');
    expect(markup).toContain("Explore hostels");
  });

  it("exposes a retry action when loading saved hostels fails", () => {
    const markup = renderToStaticMarkup(
      <WishlistsPageContent
        error="Saved-hostel service unavailable."
        hasMore={false}
        hostels={[]}
        isLoading={false}
        isLoadingMore={false}
        onLoadMore={() => {}}
        onRetry={() => {}}
      />,
    );

    expect(markup).toContain('role="alert"');
    expect(markup).toContain("Saved-hostel service unavailable.");
    expect(markup).toContain("Try again");
  });

  it("links saved hostel cards by slug and offers pagination", () => {
    const markup = renderToStaticMarkup(
      <WishlistsPageContent
        error={null}
        hasMore
        hostels={[
          {
            id: "hostel-1",
            slug: "gulberg-student-stay",
            name: "Gulberg Student Stay",
            city: "Lahore",
            area: "Gulberg",
            pricePerMonth: 18_000,
            coverImage: null,
            images: [],
            rating: 4.5,
            reviewCount: 12,
          },
        ]}
        isLoading={false}
        isLoadingMore={false}
        onLoadMore={() => {}}
        onRetry={() => {}}
      />,
    );

    expect(markup).toContain('href="/hostels/gulberg-student-stay"');
    expect(markup).toContain("Gulberg Student Stay");
    expect(markup).toContain("PKR 18,000");
    expect(markup).toContain("Show more");
  });

  it("uses Tailwind utilities for saved hostel card layout and image hover", () => {
    const markup = renderToStaticMarkup(
      <WishlistsPageContent
        error={null}
        hasMore={false}
        hostels={[
          {
            id: "hostel-1",
            slug: "gulberg-student-stay",
            name: "Gulberg Student Stay",
            city: "Lahore",
            area: "Gulberg",
            pricePerMonth: 18_000,
            coverImage: "https://images.example.com/hostel.jpg",
            images: [],
            rating: 4.5,
            reviewCount: 12,
          },
        ]}
        isLoading={false}
        isLoadingMore={false}
        onLoadMore={() => {}}
        onRetry={() => {}}
      />,
    );

    expect(markup).toContain(
      "grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))]",
    );
    expect(markup).toContain("group-hover:brightness-[0.9]");
    expect(markup).toContain("object-cover");
  });
});
