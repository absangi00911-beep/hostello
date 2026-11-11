import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  AdminPayoutsContent,
  VoidForm,
  type AdminPayoutsContentProps,
} from "./AdminPayoutsPage";
import type { AdminPayout, AdminPayoutOwner } from "./adminPayouts";

const payout = (overrides: Partial<AdminPayout> = {}): AdminPayout => ({
  id: "p1",
  amount: 42000,
  status: "PENDING",
  reference: null,
  approvedBy: null,
  approvedAt: null,
  createdAt: "2026-11-01T10:00:00.000Z",
  paidAt: null,
  cancelledAt: null,
  cancellationReason: null,
  destination: {
    bankAccountTitle: "Bilal Khan",
    bankAccountNumber: "PK36SCBL0000001123456702",
    bankName: "Standard Chartered",
  },
  destinationStatus: "available",
  auditEvents: [
    {
      id: "e1",
      action: "BATCH_CREATED",
      reference: null,
      reason: null,
      createdAt: "2026-11-01T10:00:00.000Z",
    },
  ],
  ...overrides,
});

const owner = (overrides: Partial<AdminPayoutOwner> = {}): AdminPayoutOwner => ({
  id: "o1",
  name: "Bilal",
  email: "bilal@example.com",
  hasBankDetails: true,
  pendingBalance: 10000,
  payouts: [payout()],
  payoutHistoryTruncated: false,
  ...overrides,
});

const base: AdminPayoutsContentProps = {
  owners: [],
  total: 0,
  payoutHistoryPerOwner: 20,
  hasMore: false,
  isLoading: false,
  isLoadingMore: false,
  loadError: null,
  moreError: null,
  notice: null,
  onRetry: vi.fn(),
  onLoadMore: vi.fn(),
  onGenerate: vi.fn(),
  onApprove: vi.fn(),
  onVoid: vi.fn(),
};

const render = (overrides: Partial<AdminPayoutsContentProps> = {}) =>
  renderToStaticMarkup(<AdminPayoutsContent {...base} {...overrides} />);

describe("AdminPayoutsContent", () => {
  it("states the second approval and settlement readiness gates", () => {
    expect(render()).toContain("second admin must approve");
    expect(render()).toContain("settlement remains disabled");
  });

  it("shows loading, error and empty states", () => {
    expect(render({ isLoading: true })).toContain("Loading payouts...");
    const error = render({ loadError: "Forbidden" });
    expect(error).toContain("Forbidden");
    expect(error).toContain("Try again");
    expect(render()).toContain("No owners have money ready for payout");
  });

  it("shows an owner's balance, pending destination and actions", () => {
    const markup = render({ owners: [owner()], total: 1 });
    expect(markup).toContain("Bilal");
    expect(markup).toContain("bilal@example.com");
    expect(markup).toContain("Awaiting second approval");
    expect(markup).toContain("Standard Chartered");
    expect(markup).toContain("Show account number");
    expect(markup).not.toContain("PK36SCBL0000001123456702");
    expect(markup).toContain("Generate payout batch");
    expect(markup).toContain("Approve payout");
    expect(markup).toContain("this workflow cannot void an approved batch");
    expect(markup).not.toContain("Mark as paid");
    expect(markup).toContain("Void batch");
    expect(markup).toContain("Batch created");
  });

  it("disables batch generation and says why when bank details are missing", () => {
    const markup = render({
      owners: [owner({ hasBankDetails: false, payouts: [] })],
      total: 1,
    });
    expect(markup).toContain("Bank details are incomplete");
    expect(markup).toMatch(/disabled=""[^>]*>Generate payout batch/);
  });

  it("shows paid and voided history without actions or bank details", () => {
    const markup = render({
      owners: [
        owner({
          payouts: [
            payout({
              id: "p2",
              status: "PAID",
              reference: "TXN-9",
              paidAt: "2026-11-02T08:00:00.000Z",
              destination: null,
              destinationStatus: "not-applicable",
            }),
            payout({
              id: "p3",
              status: "CANCELLED",
              cancelledAt: "2026-11-02T09:00:00.000Z",
              cancellationReason: "Owner changed bank",
              destination: null,
              destinationStatus: "not-applicable",
            }),
          ],
        }),
      ],
      total: 1,
    });
    expect(markup).toContain("reference TXN-9");
    expect(markup).toContain("Owner changed bank");
    expect(markup).not.toContain("Standard Chartered");
    expect(markup).not.toContain("Void batch<");
  });

  it("explains a pending batch whose destination is unusable", () => {
    const markup = render({
      owners: [
        owner({
          payouts: [payout({ destination: null, destinationStatus: "unavailable" })],
        }),
      ],
      total: 1,
    });
    expect(markup).toContain("could not be decrypted");
  });

  it("notes truncated history and offers load more", () => {
    const markup = render({
      owners: [owner({ payoutHistoryTruncated: true })],
      total: 30,
      hasMore: true,
    });
    expect(markup).toContain("Showing the latest 20 payouts.");
    expect(markup).toContain("Load more");
  });

  it("shows notices with the right role", () => {
    expect(render({ notice: { tone: "success", text: "Done" } })).toContain('role="status"');
    expect(render({ notice: { tone: "error", text: "Nope" } })).toContain('role="alert"');
  });
});

describe("approved payout state", () => {
  it("shows the approval timestamp and blocks any transfer action", () => {
    const markup = render({
      owners: [owner({ payouts: [payout({
        status: "APPROVED",
        approvedBy: "admin-2",
        approvedAt: "2026-11-02T08:00:00.000Z",
      })] })],
      total: 1,
    });
    expect(markup).toContain("Approved (settlement blocked)");
    expect(markup).toContain("Approved by a second admin on");
    expect(markup).toContain("do not send funds");
    expect(markup).not.toContain("Mark as paid");
    expect(markup).not.toContain("Void batch");
  });
});

describe("VoidForm", () => {
  it("requires confirming that no transfer was sent, so the button starts disabled", () => {
    const markup = renderToStaticMarkup(
      <VoidForm busy={false} error={null} onCancel={vi.fn()} onConfirm={vi.fn()} />,
    );
    expect(markup).toContain("no transfer was sent");
    expect(markup).toMatch(/disabled=""[^>]*>Void batch/);
  });
});
