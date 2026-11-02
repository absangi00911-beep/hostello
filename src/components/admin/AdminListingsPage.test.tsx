import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  AdminListingsContent,
  ModerationForm,
  ReviewDetails,
  type AdminListingsContentProps,
} from "./AdminListingsPage";
import type { AdminListing } from "./adminListings";

const listing = (overrides: Partial<AdminListing> = {}): AdminListing => ({
  id: "h1",
  name: "Green Hostel",
  slug: "green-hostel",
  status: "PENDING_REVIEW",
  city: "Lahore",
  verified: false,
  createdAt: "2026-10-20T09:00:00.000Z",
  completeness: 72,
  description: "Near campus.",
  images: ["https://images.unsplash.com/a.jpg"],
  amenities: ["wifi", "cctv"],
  rules: ["No smoking"],
  ownerName: "Sana",
  ownerEmail: "sana@example.com",
  ...overrides,
});

const base: AdminListingsContentProps = {
  status: "PENDING_REVIEW",
  searchInput: "",
  listings: [],
  total: 0,
  hasMore: false,
  isLoading: false,
  isLoadingMore: false,
  loadError: null,
  moreError: null,
  notice: null,
  onStatusChange: vi.fn(),
  onSearchInputChange: vi.fn(),
  onSearch: vi.fn(),
  onRetry: vi.fn(),
  onLoadMore: vi.fn(),
  onModerate: vi.fn(),
};

const render = (overrides: Partial<AdminListingsContentProps> = {}) =>
  renderToStaticMarkup(<AdminListingsContent {...base} {...overrides} />);

describe("AdminListingsContent", () => {
  it("shows the status tabs with the active one pressed, and a search box", () => {
    const markup = render({ status: "SUSPENDED" });
    expect(markup).toMatch(/aria-pressed="true"[^>]*>Suspended/);
    expect(markup).toContain("Pending review");
    expect(markup).toContain("Search by name, city or slug");
  });

  it("shows loading, error and empty states", () => {
    expect(render({ isLoading: true })).toContain("Loading listings...");
    const error = render({ loadError: "Forbidden" });
    expect(error).toContain("Forbidden");
    expect(error).toContain("Try again");
    expect(render()).toContain("Nothing waiting for review.");
    expect(render({ status: "ACTIVE" })).toContain("No listings match.");
  });

  it("shows a pending listing with verify and suspend but no reactivate", () => {
    const markup = render({ listings: [listing()], total: 1 });
    expect(markup).toContain("Green Hostel");
    expect(markup).toContain("72% complete");
    expect(markup).toContain("Sana");
    expect(markup).toContain("Review details");
    expect(markup).toContain("Verify and publish");
    expect(markup).toContain(">Suspend<");
    expect(markup).not.toContain("Reactivate");
    expect(markup).not.toContain("View public page");
  });

  it("flags low completeness", () => {
    expect(render({ listings: [listing({ completeness: 30 })], total: 1 })).toContain(
      "bg-[#fbf4e6]",
    );
  });

  it("offers suspend and a public link for live listings", () => {
    const markup = render({
      status: "ACTIVE",
      listings: [listing({ status: "ACTIVE", verified: true })],
      total: 1,
    });
    expect(markup).toContain("Verified");
    expect(markup).toContain(">Suspend<");
    expect(markup).toContain('href="/hostels/green-hostel"');
    expect(markup).not.toContain("Verify and publish");
  });

  it("offers only reactivate for suspended listings", () => {
    const markup = render({
      status: "SUSPENDED",
      listings: [listing({ status: "SUSPENDED" })],
      total: 1,
    });
    expect(markup).toContain("Reactivate");
    expect(markup).not.toContain(">Suspend<");
    expect(markup).not.toContain("Verify and publish");
  });

  it("shows a notice and the load more button", () => {
    const markup = render({
      notice: { tone: "success", text: "Green Hostel is verified and live." },
      listings: [listing()],
      total: 30,
      hasMore: true,
    });
    expect(markup).toContain("Green Hostel is verified and live.");
    expect(markup).toContain("Load more");
  });
});

describe("ModerationForm", () => {
  const props = { busy: false, error: null, onSubmit: vi.fn(), onCancel: vi.fn() };

  it("blocks verifying until every check is ticked", () => {
    const markup = renderToStaticMarkup(<ModerationForm mode="verify" {...props} />);
    expect(markup).toContain("The photos show this property");
    expect(markup).toContain("The owner is allowed to list this property");
    expect(markup.match(/type="checkbox"/g)).toHaveLength(4);
    expect(markup).toMatch(/<button[^>]*disabled=""[^>]*>Verify and publish/);
  });

  it("explains the consequences of suspending", () => {
    const markup = renderToStaticMarkup(<ModerationForm mode="suspend" {...props} />);
    expect(markup).toContain("removed from search");
    expect(markup).toContain("Suspend listing");
  });

  it("asks for confirmation before reactivating", () => {
    const markup = renderToStaticMarkup(<ModerationForm mode="activate" {...props} />);
    expect(markup).toContain("Make this listing live again?");
    expect(markup).toContain("Reactivate listing");
  });

  it("shows API errors and the working state", () => {
    const markup = renderToStaticMarkup(
      <ModerationForm mode="suspend" {...props} busy error="Already changed." />,
    );
    expect(markup).toContain("Already changed.");
    expect(markup).toContain("Working…");
  });
});

describe("ReviewDetails", () => {
  it("shows the address, rooms, owner and content", () => {
    const markup = renderToStaticMarkup(
      <ReviewDetails
        detail={{
          area: "Johar Town",
          address: "12 Canal Road",
          gender: "FEMALE",
          pricePerMonth: 15000,
          capacity: 20,
          rooms: [{ id: "r1", name: "Double", pricePerMonth: 15000, capacity: 2 }],
          ownerName: "Sana",
          ownerEmail: "sana@example.com",
          ownerSince: "2026-01-01T00:00:00.000Z",
          ownerListingCount: 2,
        }}
        detailError={null}
        isLoading={false}
        listing={listing()}
      />,
    );
    expect(markup).toContain("12 Canal Road");
    expect(markup).toContain("Double");
    expect(markup).toContain("2 listings");
    expect(markup).toContain("Near campus.");
    expect(markup).toContain("wifi, cctv");
    expect(markup).toContain("No smoking");
    expect(markup).toContain("Green Hostel photo 1");
  });

  it("shows loading and error states, and missing photos", () => {
    const loading = renderToStaticMarkup(
      <ReviewDetails detail={null} detailError={null} isLoading listing={listing({ images: [] })} />,
    );
    expect(loading).toContain("Loading details...");
    expect(loading).toContain("No photos uploaded.");
    const failed = renderToStaticMarkup(
      <ReviewDetails detail={null} detailError="Forbidden" isLoading={false} listing={listing()} />,
    );
    expect(failed).toContain("Forbidden");
  });
});
