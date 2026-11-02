import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  OwnerBlockedDatesContent,
  type OwnerBlockedDatesContentProps,
} from "./OwnerBlockedDatesPage";

const base: OwnerBlockedDatesContentProps = {
  listingName: "Green Hostel",
  isLoading: false,
  loadError: null,
  ranges: [],
  total: 0,
  hasMore: false,
  isLoadingMore: false,
  moreError: null,
  removingId: null,
  removeError: null,
  form: { startDate: "", endDate: "", reason: "" },
  formError: null,
  isSaving: false,
  onFormChange: vi.fn(),
  onSubmit: vi.fn(),
  onRemove: vi.fn(),
  onRetry: vi.fn(),
  onLoadMore: vi.fn(),
};

const range = {
  id: "b1",
  startDate: "2026-10-10T00:00:00.000Z",
  endDate: "2026-10-12T00:00:00.000Z",
  reason: "Repairs",
};

const render = (overrides: Partial<OwnerBlockedDatesContentProps> = {}) =>
  renderToStaticMarkup(<OwnerBlockedDatesContent {...base} {...overrides} />);

describe("OwnerBlockedDatesContent", () => {
  it("names the listing and explains what blocking does", () => {
    const markup = render();
    expect(markup).toContain("Green Hostel");
    expect(markup).toContain("Existing bookings aren&#x27;t cancelled.");
    expect(markup).toContain("Block these dates");
  });

  it("shows a loading state", () => {
    expect(render({ isLoading: true })).toContain("Loading blocked dates...");
  });

  it("shows the error with a retry button", () => {
    const markup = render({ loadError: "Not found" });
    expect(markup).toContain("Not found");
    expect(markup).toContain("Try again");
  });

  it("shows the empty state", () => {
    expect(render()).toContain("No blocked dates.");
  });

  it("lists ranges with their reason and a remove button", () => {
    const markup = render({ ranges: [range], total: 1 });
    expect(markup).toMatch(/10\D+Oct\D+2026 – 12\D+Oct\D+2026/);
    expect(markup).toContain("Repairs");
    expect(markup).toContain("1 range");
    expect(markup).toContain("Remove");
  });

  it("shows removing and saving states", () => {
    expect(render({ ranges: [range], total: 1, removingId: "b1" })).toContain("Removing…");
    expect(render({ isSaving: true })).toContain("Saving…");
  });

  it("surfaces form and remove errors", () => {
    const markup = render({
      formError: "Choose a start and end date.",
      removeError: "We couldn't remove that block.",
    });
    expect(markup).toContain("Choose a start and end date.");
    expect(markup).toContain("We couldn&#x27;t remove that block.");
  });

  it("offers load more when there are further pages", () => {
    expect(render({ ranges: [range], total: 30, hasMore: true })).toContain("Load more");
  });
});
