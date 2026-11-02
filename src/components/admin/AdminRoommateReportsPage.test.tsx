import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  AdminRoommateReportsContent,
  DeleteForm,
  type AdminRoommateReportsContentProps,
} from "./AdminRoommateReportsPage";
import type { ReportedRoommatePost } from "./adminRoommateReports";

const post = (
  overrides: Partial<ReportedRoommatePost> = {},
): ReportedRoommatePost => ({
  id: "p1",
  bio: "Final year student looking for a quiet roommate.",
  budget: 15000,
  moveIn: "2026-12-01T00:00:00.000Z",
  createdAt: "2026-10-28T09:00:00.000Z",
  expiresAt: "2026-11-28T09:00:00.000Z",
  hostelName: "Green Hostel",
  hostelSlug: "green-hostel",
  authorName: "Ayesha",
  reports: [
    {
      id: "r1",
      reason: "Asked me to pay outside the platform",
      createdAt: "2026-11-01T10:00:00.000Z",
      reporterName: "Sara",
    },
  ],
  reportCount: 1,
  ...overrides,
});

// A fixed clock: 2 Nov 2026, before the sample post expires on 28 Nov.
const NOW = Date.parse("2026-11-02T12:00:00.000Z");

const base: AdminRoommateReportsContentProps = {
  posts: [],
  total: 0,
  hideThreshold: 3,
  now: NOW,
  hasMore: false,
  isLoading: false,
  isLoadingMore: false,
  loadError: null,
  moreError: null,
  notice: null,
  onRetry: vi.fn(),
  onLoadMore: vi.fn(),
  onDelete: vi.fn(),
};

const render = (overrides: Partial<AdminRoommateReportsContentProps> = {}) =>
  renderToStaticMarkup(<AdminRoommateReportsContent {...base} {...overrides} />);

describe("AdminRoommateReportsContent", () => {
  it("explains the hide threshold and that delete is the only action", () => {
    const markup = render();
    expect(markup).toContain("hidden");
    expect(markup).toContain("3 reports");
    expect(markup).toContain("reports cannot be dismissed");
  });

  it("shows loading, error and empty states", () => {
    expect(render({ isLoading: true })).toContain("Loading reported posts...");
    const error = render({ loadError: "Forbidden" });
    expect(error).toContain("Forbidden");
    expect(error).toContain("Try again");
    expect(render()).toContain("No roommate posts have been reported.");
  });

  it("shows a reported post with its reasons and a delete action", () => {
    const markup = render({ posts: [post()], total: 1 });
    expect(markup).toContain("Ayesha");
    expect(markup).toContain("1 report<");
    expect(markup).toContain("Green Hostel");
    expect(markup).toContain('href="/hostels/green-hostel"');
    expect(markup).toContain("Final year student looking for a quiet roommate.");
    expect(markup).toContain("Asked me to pay outside the platform");
    expect(markup).toContain("Sara");
    expect(markup).toContain("1 reported post<");
    expect(markup).toContain(">Delete post<");
  });

  it("shows budget and move-in only when present", () => {
    const withBoth = render({ posts: [post()], total: 1 });
    expect(withBoth).toContain("/ month");
    expect(withBoth).toContain("move-in");
    const without = render({
      posts: [post({ budget: null, moveIn: null })],
      total: 1,
    });
    expect(without).not.toContain("/ month");
    expect(without).not.toContain("move-in");
  });

  it("says whether a post is still visible or hidden from students", () => {
    expect(render({ posts: [post({ reportCount: 2 })], total: 1 })).toContain(
      "Still visible",
    );
    const hidden = render({ posts: [post({ reportCount: 3 })], total: 1 });
    expect(hidden).toContain("Hidden from students");
    expect(hidden).toContain("3 reports");
  });

  it("flags expired posts using the load time it is given", () => {
    expect(render({ posts: [post()], total: 1 })).not.toContain("Expired");
    expect(
      render({
        posts: [post()],
        total: 1,
        now: Date.parse("2026-12-01T00:00:00.000Z"),
      }),
    ).toContain("Expired");
  });

  it("notes when only the latest reports are listed", () => {
    expect(render({ posts: [post({ reportCount: 63 })], total: 1 })).toContain(
      "Showing the latest 1 of 63 reports.",
    );
    expect(render({ posts: [post()], total: 1 })).not.toContain("Showing the latest");
  });

  it("does not open the delete confirmation until asked", () => {
    expect(render({ posts: [post()], total: 1 })).not.toContain(
      "Delete this post permanently?",
    );
  });

  it("shows a notice and the load more button", () => {
    const markup = render({
      notice: { tone: "success", text: "Ayesha's post on Green Hostel was deleted." },
      posts: [post()],
      total: 30,
      hasMore: true,
    });
    expect(markup).toContain("Ayesha&#x27;s post on Green Hostel was deleted.");
    expect(markup).toContain("Load more");
  });
});

describe("DeleteForm", () => {
  const form = (overrides = {}, reportCount = 3) =>
    renderToStaticMarkup(
      <DeleteForm
        busy={false}
        error={null}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        post={post({ reportCount })}
        {...overrides}
      />,
    );

  it("warns that it is permanent and the author is not notified", () => {
    const markup = form();
    expect(markup).toContain("Delete this post permanently?");
    expect(markup).toContain("3 reports are deleted with it");
    expect(markup).toContain("The author is not notified");
    expect(markup).toContain("cannot be undone");
  });

  it("uses the singular for a single report", () => {
    expect(form({}, 1)).toContain("report is deleted with it");
  });

  it("shows API errors and a busy state", () => {
    const markup = form({ error: "Too many moderation actions.", busy: true });
    expect(markup).toContain("Too many moderation actions.");
    expect(markup).toContain("Working…");
    expect(markup).toContain("disabled");
  });
});
