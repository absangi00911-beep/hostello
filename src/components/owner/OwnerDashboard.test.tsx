import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { OwnerDashboardContent, type OwnerDashboardContentProps } from "./OwnerDashboard";
import type { OwnerListing } from "./ownerListings";

const base: OwnerDashboardContentProps = {
  ownerName: "Sana",
  filter: "ALL",
  items: [],
  total: 0,
  hasMore: false,
  isLoading: false,
  isLoadingMore: false,
  loadError: null,
  moreError: null,
  onFilterChange: vi.fn(),
  onLoadMore: vi.fn(),
  onRetry: vi.fn(),
};

const listing = (overrides: Partial<OwnerListing>): OwnerListing => ({
  id: "h1",
  name: "Green Hostel",
  slug: "green hostel",
  status: "ACTIVE",
  city: "Faisalabad",
  area: "Satiana Road",
  pricePerMonth: 12000,
  rooms: 1,
  capacity: 12,
  coverImage: null,
  rating: 0,
  reviewCount: 0,
  ...overrides,
});

const render = (props: Partial<OwnerDashboardContentProps>) =>
  renderToStaticMarkup(<OwnerDashboardContent {...base} {...props} />);

describe("OwnerDashboardContent", () => {
  it("only links to pages that exist today", () => {
    const markup = render({});

    for (const href of ["/owner/analytics", "/messages", "/notifications"]) {
      expect(markup).toContain(`href="${href}"`);
    }
    expect(markup).toContain('href="/owner/listings/new"');
    // Edit routes don't exist yet, so listing rows must not link to them.
    expect(markup).not.toContain("/edit");
  });

  it("shows loading, empty and filtered-empty states", () => {
    expect(render({ isLoading: true })).toContain("Loading listings...");
    expect(render({})).toContain("You don&#x27;t have any listings yet.");
    expect(render({ filter: "PENDING_REVIEW" })).toContain("No pending review listings.");
  });

  it("shows a recoverable error", () => {
    const markup = render({ loadError: "Could not load your listings." });

    expect(markup).toContain('role="alert"');
    expect(markup).toContain("Could not load your listings.");
    expect(markup).toContain("Try again");
  });

  it("marks the selected status filter as pressed", () => {
    const markup = render({ filter: "DRAFT" });

    expect(markup).toMatch(/aria-pressed="true"[^>]*>Drafts</);
    expect(markup).toMatch(/aria-pressed="false"[^>]*>All</);
  });

  it("links only live listings publicly and explains review states", () => {
    const markup = render({
      total: 4,
      items: [
        listing({ id: "a", name: "Live One", status: "ACTIVE", reviewCount: 3, rating: 4.25 }),
        listing({ id: "b", name: "Review One", status: "PENDING_REVIEW", slug: "review-one" }),
        listing({ id: "c", name: "Draft One", status: "DRAFT", slug: "draft-one" }),
        listing({ id: "d", name: "Stopped One", status: "SUSPENDED", slug: "stopped-one" }),
      ],
    });

    expect(markup).toContain('href="/hostels/green%20hostel"');
    expect(markup).not.toContain("/hostels/review-one");
    expect(markup).not.toContain("/hostels/draft-one");
    expect(markup).not.toContain("/hostels/stopped-one");
    expect(markup).toContain("Under review");
    expect(markup).toContain("Draft. It isn&#x27;t visible");
    expect(markup).toContain("Suspended and hidden");
    expect(markup).toContain('href="/contact"');
    expect(markup).toContain("4 listings");
    expect(markup).toContain("★ 4.3 (3)");
  });

  it("offers load more only when there are further pages", () => {
    expect(render({ hasMore: true, items: [listing({})], total: 30 })).toContain("Load more");
    expect(render({ hasMore: false, items: [listing({})], total: 1 })).not.toContain("Load more");
  });
});
