import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  AdminRefundsContent,
  RefundConfirmForm,
  type AdminRefundsContentProps,
} from "./AdminRefundsPage";
import type { RefundBooking } from "./adminRefunds";

const booking = (overrides: Partial<RefundBooking> = {}): RefundBooking => ({
  id: "b1",
  hostelName: "Green Hostel",
  studentName: "Ayesha",
  studentEmail: "ayesha@example.com",
  checkIn: "2026-12-01T00:00:00.000Z",
  checkOut: "2027-01-01T00:00:00.000Z",
  total: 20000,
  approvedAmount: 15000,
  refundedAmount: 0,
  remainingAmount: 15000,
  refundState: "NONE",
  ...overrides,
});

const base: AdminRefundsContentProps = {
  bookings: [],
  hasMore: false,
  isLoading: false,
  isLoadingMore: false,
  loadError: null,
  moreError: null,
  notice: null,
  onRetry: vi.fn(),
  onLoadMore: vi.fn(),
  onRefund: vi.fn(),
};

const render = (overrides: Partial<AdminRefundsContentProps> = {}) =>
  renderToStaticMarkup(<AdminRefundsContent {...base} {...overrides} />);

describe("AdminRefundsContent", () => {
  it("explains where the amount comes from and the hourly limit", () => {
    const markup = render();
    expect(markup).toContain("cancellation terms");
    expect(markup).toContain("5 refund actions an hour");
  });

  it("shows loading, error and empty states", () => {
    expect(render({ isLoading: true })).toContain("Loading cancelled bookings...");
    const error = render({ loadError: "Forbidden" });
    expect(error).toContain("Forbidden");
    expect(error).toContain("Try again");
    expect(render()).toContain("No cancelled bookings need a refund.");
  });

  it("does not claim there is nothing to refund while more bookings can load", () => {
    const markup = render({ hasMore: true });
    expect(markup).toContain("No refunds are needed in the bookings loaded so far.");
    expect(markup).toContain("Load older bookings");
    expect(markup).toContain("no refund queue endpoint");
  });

  it("shows the amounts and an automatic refund action", () => {
    const markup = render({ bookings: [booking()] });
    expect(markup).toContain("Ayesha");
    expect(markup).toContain("Green Hostel");
    expect(markup).toContain("Not refunded");
    expect(markup).toContain("Left to refund");
    expect(markup).toContain("Refund via Safepay");
    expect(markup).not.toContain("Confirm refund manually");
  });

  it("shows already-refunded money for partial refunds", () => {
    const markup = render({
      bookings: [
        booking({ refundState: "PARTIALLY_REFUNDED", refundedAmount: 5000, remainingAmount: 10000 }),
      ],
    });
    expect(markup).toContain("Already refunded");
    expect(markup).toContain("Partly refunded");
  });

  it("offers only manual confirmation for an unconfirmed refund", () => {
    const markup = render({ bookings: [booking({ refundState: "UNCERTAIN" })] });
    expect(markup).toContain("Outcome unconfirmed");
    expect(markup).toContain("a second automatic request is blocked");
    expect(markup).toContain("Confirm refund manually");
    expect(markup).not.toContain("Refund via Safepay");
  });

  it("explains the 5-minute rule for a refund in progress", () => {
    const markup = render({ bookings: [booking({ refundState: "PROCESSING" })] });
    expect(markup).toContain("Refund in progress");
    expect(markup).toContain("more than 5 minutes");
  });

  it("shows notices with the right role", () => {
    expect(render({ notice: { tone: "success", text: "Done" } })).toContain('role="status"');
    expect(render({ notice: { tone: "error", text: "Nope" } })).toContain('role="alert"');
  });
});

describe("RefundConfirmForm", () => {
  const form = (manual: boolean, error: string | null = null) =>
    renderToStaticMarkup(
      <RefundConfirmForm
        booking={booking()}
        busy={false}
        error={error}
        manual={manual}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

  it("warns that an automatic refund is irreversible", () => {
    const markup = form(false);
    expect(markup).toContain("cannot be undone");
    expect(markup).toContain("Send refund");
  });

  it("requires verifying in Safepay before a manual confirmation", () => {
    const markup = form(true);
    expect(markup).toContain("I verified this refund in Safepay.");
    expect(markup).toMatch(/disabled=""[^>]*>Confirm refund manually/);
  });

  it("shows a server error", () => {
    expect(form(false, "Booking changed")).toContain("Booking changed");
  });
});
