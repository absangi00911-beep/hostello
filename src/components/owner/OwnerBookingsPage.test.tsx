import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  OwnerBookingsContent,
  type OwnerBookingsContentProps,
} from "./OwnerBookingsPage";
import type { OwnerBooking } from "./ownerBookings";

const DUE = Date.parse("2026-11-03T06:00:00.000Z");

const base: OwnerBookingsContentProps = {
  filter: "PENDING",
  items: [],
  total: 0,
  hasMore: false,
  isLoading: false,
  isLoadingMore: false,
  loadError: null,
  moreError: null,
  notice: null,
  now: DUE - 5 * 3_600_000,
  busyId: null,
  decliningId: null,
  onFilterChange: vi.fn(),
  onLoadMore: vi.fn(),
  onRetry: vi.fn(),
  onConfirm: vi.fn(),
  onAskDecline: vi.fn(),
  onCancelDecline: vi.fn(),
  onDecline: vi.fn(),
};

const booking = (overrides: Partial<OwnerBooking> = {}): OwnerBooking => ({
  id: "b1",
  status: "PENDING",
  checkIn: "2026-12-01T00:00:00.000Z",
  checkOut: "2027-01-01T00:00:00.000Z",
  months: 1,
  guests: 1,
  total: 12000,
  createdAt: "2026-11-02T06:00:00.000Z",
  ownerResponseDueAt: "2026-11-03T06:00:00.000Z",
  hostel: { id: "h1", name: "Green Hostel" },
  student: { name: "Ayesha", email: "ayesha@example.com", phone: "+923001234567" },
  ...overrides,
});

const render = (props: Partial<OwnerBookingsContentProps>) =>
  renderToStaticMarkup(<OwnerBookingsContent {...base} {...props} />);

describe("OwnerBookingsContent", () => {
  it("marks the selected filter and explains the 24-hour rule", () => {
    const markup = render({});

    expect(markup).toMatch(/aria-pressed="true"[^>]*>Needs response</);
    expect(markup).toMatch(/aria-pressed="false"[^>]*>All</);
    expect(markup).toContain("Respond within 24 hours");
    expect(markup).toContain('href="/owner"');
  });

  it("shows loading, empty and recoverable error states", () => {
    expect(render({ isLoading: true })).toContain("Loading bookings...");
    expect(render({})).toContain("No booking requests are waiting for you.");
    expect(render({ filter: "CANCELLED" })).toContain("No cancelled bookings.");
    const error = render({ loadError: "Could not load your bookings." });
    expect(error).toContain('role="alert"');
    expect(error).toContain("Try again");
  });

  it("shows the student, contact links, total and countdown for a pending request", () => {
    const markup = render({ items: [booking()], total: 1 });

    expect(markup).toContain("Ayesha");
    expect(markup).toContain('href="mailto:ayesha@example.com"');
    expect(markup).toContain('href="tel:+923001234567"');
    expect(markup).toContain("Green Hostel");
    expect(markup).toContain("Respond within 5h 0m");
    expect(markup).toContain("Confirm booking");
    expect(markup).toContain(">Decline<");
    expect(markup).toContain("1 booking");
  });

  it("asks for confirmation before declining and states the full refund", () => {
    const markup = render({ items: [booking()], total: 1, decliningId: "b1" });

    expect(markup).toContain("will be refunded");
    expect(markup).toContain("in full");
    expect(markup).toContain("Yes, decline and refund");
    expect(markup).toContain("Keep request");
    expect(markup).not.toContain("Confirm booking");
  });

  it("removes the actions once the response window has ended", () => {
    const markup = render({ items: [booking()], total: 1, now: DUE + 1 });

    expect(markup).toContain("response window has ended");
    expect(markup).not.toContain("Confirm booking");
    expect(markup).not.toContain(">Decline<");
  });

  it("offers no actions for settled bookings", () => {
    const markup = render({
      filter: "ALL",
      items: [booking({ status: "CONFIRMED" }), booking({ id: "b2", status: "CANCELLED" })],
      total: 2,
    });

    expect(markup).not.toContain("Confirm booking");
    expect(markup).not.toContain("Respond within 5h");
    expect(markup).toContain("Confirmed");
    expect(markup).toContain("Cancelled");
  });

  it("disables actions and relabels the button while a request is in flight", () => {
    const markup = render({ items: [booking()], total: 1, busyId: "b1" });

    expect(markup).toContain("Confirming…");
    expect(markup).toMatch(/disabled=""[^>]*>Confirming…/);
  });

  it("announces success and error notices differently", () => {
    expect(render({ notice: { tone: "success", text: "Booking confirmed." } })).toContain(
      'role="status"',
    );
    expect(render({ notice: { tone: "error", text: "Booking changed." } })).toContain(
      'role="alert"',
    );
  });

  it("offers load more only when there are further pages", () => {
    expect(render({ hasMore: true, items: [booking()], total: 30 })).toContain("Load more");
    expect(render({ items: [booking()], total: 1 })).not.toContain("Load more");
  });
});
