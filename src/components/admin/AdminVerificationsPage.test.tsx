import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  AdminVerificationsContent,
  DecisionForm,
  DocumentPreview,
  type AdminVerificationsContentProps,
} from "./AdminVerificationsPage";
import type { AdminVerification } from "./adminVerifications";

const student = (overrides: Partial<AdminVerification> = {}): AdminVerification => ({
  id: "u1",
  name: "Ayesha Khan",
  email: "ayesha@example.com",
  city: "Lahore",
  documentUrl: "/api/admin/verifications/u1/document",
  documentContentType: "image/jpeg",
  submittedAt: "2026-10-30T08:00:00.000Z",
  bookingCount: 2,
  ...overrides,
});

const base: AdminVerificationsContentProps = {
  status: "PENDING",
  searchInput: "",
  students: [],
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
  onDecide: vi.fn(),
};

const render = (overrides: Partial<AdminVerificationsContentProps> = {}) =>
  renderToStaticMarkup(<AdminVerificationsContent {...base} {...overrides} />);

describe("AdminVerificationsContent", () => {
  it("shows the status tabs with the active one pressed, and a search box", () => {
    const markup = render({ status: "REJECTED" });
    expect(markup).toMatch(/aria-pressed="true"[^>]*>Rejected/);
    expect(markup).toContain("Pending");
    expect(markup).toContain("Approved");
    expect(markup).toContain("Search by name or email");
  });

  it("shows loading, error and empty states", () => {
    expect(render({ isLoading: true })).toContain(
      "Loading verification requests...",
    );
    const error = render({ loadError: "Forbidden" });
    expect(error).toContain("Forbidden");
    expect(error).toContain("Try again");
    expect(render()).toContain("No verification requests are waiting.");
    expect(render({ status: "APPROVED" })).toContain("No students match.");
  });

  it("shows a pending request with review, approve and reject actions", () => {
    const markup = render({ students: [student()], total: 1 });
    expect(markup).toContain("Ayesha Khan");
    expect(markup).toContain("ayesha@example.com");
    expect(markup).toContain("Lahore");
    expect(markup).toContain("2 bookings");
    expect(markup).toContain("Review document");
    expect(markup).toContain(">Approve<");
    expect(markup).toContain(">Reject<");
  });

  it("does not load the document until a reviewer opens it", () => {
    expect(render({ students: [student()], total: 1 })).not.toContain(
      "/api/admin/verifications/u1/document",
    );
  });

  it("uses the singular for one booking", () => {
    expect(
      render({ students: [student({ bookingCount: 1 })], total: 1 }),
    ).toContain("1 booking<");
  });

  it("blocks approving when there is no document to review", () => {
    const markup = render({
      students: [student({ documentUrl: null, documentContentType: null })],
      total: 1,
    });
    expect(markup).toMatch(/disabled=""[^>]*>Approve</);
    expect(markup).toContain(">Reject<");
  });

  it("is read-only outside the pending tab", () => {
    const markup = render({
      status: "APPROVED",
      students: [student({ documentUrl: null })],
      total: 1,
    });
    expect(markup).toContain("Ayesha Khan");
    expect(markup).toContain("Documents are deleted once a decision is made");
    expect(markup).not.toContain("Review document");
    expect(markup).not.toContain(">Approve<");
    expect(markup).not.toContain(">Reject<");
  });

  it("shows a notice and the load more button", () => {
    const markup = render({
      notice: { tone: "success", text: "Ayesha Khan is now a verified student." },
      students: [student()],
      total: 30,
      hasMore: true,
    });
    expect(markup).toContain("Ayesha Khan is now a verified student.");
    expect(markup).toContain("Load more");
  });
});

describe("DocumentPreview", () => {
  it("previews images from the admin document route", () => {
    const markup = renderToStaticMarkup(<DocumentPreview student={student()} />);
    expect(markup).toContain("Verification document submitted by Ayesha Khan");
    // Loaded straight from the auth-checked admin route, never the image optimizer.
    expect(markup).toContain('src="/api/admin/verifications/u1/document"');
    expect(markup).not.toContain("/_next/image");
  });

  it("offers a download for PDFs instead of a preview", () => {
    const markup = renderToStaticMarkup(
      <DocumentPreview student={student({ documentContentType: "application/pdf" })} />,
    );
    expect(markup).toContain("Download PDF");
    expect(markup).toContain('href="/api/admin/verifications/u1/document"');
    expect(markup).toContain('rel="noopener noreferrer"');
    expect(markup).not.toContain("<img");
  });

  it("explains when no document is available", () => {
    const markup = renderToStaticMarkup(
      <DocumentPreview student={student({ documentUrl: null })} />,
    );
    expect(markup).toContain("No document is available");
  });
});

describe("DecisionForm", () => {
  const form = (mode: "approve" | "reject", overrides = {}) =>
    renderToStaticMarkup(
      <DecisionForm
        busy={false}
        error={null}
        mode={mode}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        {...overrides}
      />,
    );

  it("asks to confirm approval and says the document is deleted", () => {
    const markup = form("approve");
    expect(markup).toContain("Approve student");
    expect(markup).toContain("document is deleted");
  });

  it("asks to confirm rejection and says the student can resubmit", () => {
    const markup = form("reject");
    expect(markup).toContain("Reject verification");
    expect(markup).toContain("can submit a new document");
  });

  it("shows API errors and a busy state", () => {
    const markup = form("reject", { error: "Too many decisions.", busy: true });
    expect(markup).toContain("Too many decisions.");
    expect(markup).toContain("Working…");
    expect(markup).toContain("disabled");
  });
});
