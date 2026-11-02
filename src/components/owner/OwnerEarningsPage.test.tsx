import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  OwnerEarningsContent,
  type OwnerEarningsContentProps,
} from "./OwnerEarningsPage";
import { BankDetailsCard } from "./BankDetailsCard";
import type { OwnerPayout } from "./ownerEarnings";

const bank = {
  bankAccountTitle: "Sana Khan",
  bankAccountNumber: "PK36SCBL0000001123456702",
  bankName: "Standard Chartered",
};

const base: OwnerEarningsContentProps = {
  isLoading: false,
  loadError: null,
  pendingBalance: 18000,
  hasBankDetails: true,
  bankDetails: bank,
  payouts: [],
  payoutTotal: 0,
  hasMore: false,
  isLoadingMore: false,
  moreError: null,
  onRetry: vi.fn(),
  onLoadMore: vi.fn(),
  onBankSaved: vi.fn(),
};

const payout = (overrides: Partial<OwnerPayout> = {}): OwnerPayout => ({
  id: "p1",
  amount: 24000,
  status: "PAID",
  reference: "TXN-1",
  createdAt: "2026-10-20T09:00:00.000Z",
  paidAt: "2026-10-22T09:00:00.000Z",
  ...overrides,
});

const render = (props: Partial<OwnerEarningsContentProps>) =>
  renderToStaticMarkup(<OwnerEarningsContent {...base} {...props} />);

describe("OwnerEarningsContent", () => {
  it("shows the ready-for-payout balance and what it means", () => {
    const markup = render({});

    expect(markup).toContain("Ready for payout");
    expect(markup).toContain("18,000");
    expect(markup).toContain("stays that have ended");
    expect(markup).toContain('href="/owner"');
  });

  it("shows loading and a recoverable error", () => {
    expect(render({ isLoading: true })).toContain("Loading earnings...");
    const markup = render({ loadError: "Could not load your earnings." });
    expect(markup).toContain('role="alert"');
    expect(markup).toContain("Try again");
    expect(markup).not.toContain("Ready for payout");
  });

  it("prompts for bank details only when money is waiting and none are saved", () => {
    const missing = render({ hasBankDetails: false, bankDetails: null });
    expect(missing).toContain("Add your bank details below");
    expect(missing).toContain("Add bank details");

    expect(
      render({ hasBankDetails: false, bankDetails: null, pendingBalance: 0 }),
    ).not.toContain("Add your bank details below");
    expect(render({})).not.toContain("Add your bank details below");
  });

  it("lists payouts with owner-facing status labels, dates and reference", () => {
    const markup = render({
      payouts: [
        payout(),
        payout({ id: "p2", status: "PENDING", reference: null, paidAt: null }),
        payout({ id: "p3", status: "CANCELLED", paidAt: null }),
      ],
      payoutTotal: 3,
    });

    expect(markup).toContain("Paid");
    expect(markup).toContain("Being processed");
    expect(markup).toContain("Cancelled");
    expect(markup).toContain("TXN-1");
    expect(markup).toContain("3 payouts");
    expect(markup).toContain("paid ");
  });

  it("explains an empty history and offers load more only when needed", () => {
    expect(render({})).toContain("No payouts yet.");
    expect(render({ payouts: [payout()], payoutTotal: 30, hasMore: true })).toContain(
      "Load more",
    );
    expect(render({ payouts: [payout()], payoutTotal: 1 })).not.toContain("Load more");
  });
});

describe("BankDetailsCard", () => {
  it("masks the account number and never prints the full one", () => {
    const markup = renderToStaticMarkup(
      <BankDetailsCard details={bank} onSaved={vi.fn()} />,
    );

    expect(markup).toContain("•••• 6702");
    expect(markup).not.toContain("PK36SCBL0000001123456702");
    expect(markup).toContain("Sana Khan");
    expect(markup).toContain("Change bank details");
  });

  it("invites owners with no details to add them", () => {
    const markup = renderToStaticMarkup(
      <BankDetailsCard details={null} onSaved={vi.fn()} />,
    );

    expect(markup).toContain("haven&#x27;t added bank details");
    expect(markup).toContain("Add bank details");
  });
});
