import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  AdminOverviewContent,
  type AdminOverviewContentProps,
} from "./AdminOverviewPage";

const base: AdminOverviewContentProps = {
  isLoading: false,
  loadError: null,
  stats: {
    totalListings: 30,
    pendingApproval: 4,
    flaggedCount: 1,
    newlyPublished: 3,
    newlyPublishedWindowDays: 7,
    flaggedThreshold: 50,
  },
  onRetry: vi.fn(),
};

const render = (overrides: Partial<AdminOverviewContentProps> = {}) =>
  renderToStaticMarkup(<AdminOverviewContent {...base} {...overrides} />);

describe("AdminOverviewContent", () => {
  it("shows the listing stats with what they mean", () => {
    const markup = render();
    expect(markup).toContain("Total listings");
    expect(markup).toContain(">30<");
    expect(markup).toContain("Pending review");
    expect(markup).toContain("completeness under 50%");
    expect(markup).toContain("Last 7 days");
  });

  it("links to every admin section that exists", () => {
    const markup = render();
    expect(markup).toContain('href="/admin/bookings"');
    expect(markup).toContain('href="/admin#listing-statistics"');
    expect(markup).toContain('href="/admin/listings"');
    expect(markup).toContain('href="/admin/verifications"');
    expect(markup).toContain('href="/admin/roommate-reports"');
    expect(markup).toContain('href="/admin/payouts"');
    expect(markup).toContain('href="/admin/refunds"');
    expect(markup).toContain('href="/admin/payment-events"');
    expect(markup).toContain('href="/admin/search-sync"');
  });

  it("shows loading and error states", () => {
    expect(render({ isLoading: true, stats: null })).toContain("Loading overview...");
    const error = render({ stats: null, loadError: "Forbidden" });
    expect(error).toContain("Forbidden");
    expect(error).toContain("Try again");
  });
});
