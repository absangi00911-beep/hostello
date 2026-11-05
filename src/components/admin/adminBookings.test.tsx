import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  AdminBookingsContent,
  type AdminBookingsContentProps,
} from "./AdminBookingsPage";
import type { AdminBooking } from "./adminBookings";
import { AdminBookingDetailContent } from "./AdminBookingDetailPage";
import {
  isCurrentAdminBookingsRequest,
  parseAdminBooking,
  parseAdminBookingsPage,
  settleAdminBookingsPaginationRequest,
} from "./adminBookings";

const booking = (overrides: Partial<AdminBooking> = {}): AdminBooking => ({
  id: "booking_1",
  status: "CONFIRMED",
  paymentStatus: "PAID",
  checkIn: "2026-12-01T00:00:00.000Z",
  checkOut: "2027-01-01T00:00:00.000Z",
  guests: 2,
  total: 40000,
  roomId: "room_1",
  hostel: { name: "Green Hostel", slug: "green-hostel", city: "Lahore" },
  ...overrides,
});

const listBase: AdminBookingsContentProps = {
  status: "ALL",
  bookings: [],
  hasMore: false,
  isLoading: false,
  isLoadingMore: false,
  loadError: null,
  moreError: null,
  onStatusChange: vi.fn(),
  onRetry: vi.fn(),
  onLoadMore: vi.fn(),
};

const renderList = (overrides: Partial<AdminBookingsContentProps> = {}) =>
  renderToStaticMarkup(<AdminBookingsContent {...listBase} {...overrides} />);

describe("admin booking response parsing", () => {
  it("keeps operational fields and excludes student and provider identifiers", () => {
    const parsed = parseAdminBooking({
      ...booking(),
      transactionId: "provider-tracker-secret",
      user: {
        id: "student_1",
        name: "Ayesha Khan",
        email: "student@example.test",
        phone: "03000000000",
      },
    });

    expect(parsed).toEqual(booking());
    expect(JSON.stringify(parsed)).not.toContain("student@example.test");
    expect(JSON.stringify(parsed)).not.toContain("provider-tracker-secret");
  });

  it("rejects malformed or unsupported booking records", () => {
    expect(parseAdminBooking({ id: "booking_1" })).toBeNull();
    expect(
      parseAdminBooking({ ...booking(), status: "ARCHIVED" }),
    ).toBeNull();
  });

  it("parses an existing paginated bookings response", () => {
    expect(
      parseAdminBookingsPage({
        data: [booking()],
        total: 1,
        page: 1,
        hasMore: false,
      }),
    ).toEqual({
      data: [booking()],
      total: 1,
      page: 1,
      hasMore: false,
    });
  });
});

describe("AdminBookingsContent", () => {
  it("shows loading, permission/error, and empty states", () => {
    expect(renderList({ isLoading: true })).toContain("Loading bookings...");
    expect(renderList({ loadError: "Forbidden" })).toContain("Forbidden");
    expect(renderList({ loadError: "Forbidden" })).toContain("Try again");
    expect(renderList()).toContain("No bookings to review.");
  });

  it("shows operational status and a navigable detail link without student PII", () => {
    const markup = renderList({ bookings: [booking()] });
    expect(markup).toContain("Green Hostel");
    expect(markup).toContain("Confirmed");
    expect(markup).toContain("Paid");
    expect(markup).toContain('href="/admin/bookings/booking_1"');
    expect(markup).not.toContain("student@example.test");
    expect(markup).not.toContain("Ayesha Khan");
    expect(markup).not.toContain("room_1");
    expect(markup).not.toContain("provider-tracker-secret");
  });

  it("ignores load-more results and finalization after switching away and back", async () => {
    let activeStatus: "ALL" | "PENDING" = "ALL";
    let activeGeneration = 0;
    const requestStatus = activeStatus;
    const requestGeneration = activeGeneration;
    const state = {
      bookings: [booking({ id: "current-booking" })],
      page: 3,
      hasMore: true,
      isLoadingMore: true,
    };
    let resolveOldPage!: (result: {
      data: AdminBooking[];
      page: number;
      hasMore: boolean;
    }) => void;
    const oldPage = new Promise<{
      data: AdminBooking[];
      page: number;
      hasMore: boolean;
    }>((resolve) => {
      resolveOldPage = resolve;
    });
    const isCurrent = () =>
      isCurrentAdminBookingsRequest(
        requestStatus,
        activeStatus,
        requestGeneration,
        activeGeneration,
      );
    const loadingMore = settleAdminBookingsPaginationRequest(
      oldPage,
      isCurrent,
      {
        onSuccess: (result) => {
          state.bookings = [...state.bookings, ...result.data];
          state.page = result.page;
          state.hasMore = result.hasMore;
        },
        onError: () => {},
        onFinally: () => {
          state.isLoadingMore = false;
        },
      },
    );
    activeStatus = "PENDING";
    activeGeneration += 1;
    activeStatus = "ALL";
    activeGeneration += 1;
    resolveOldPage({
      data: [booking({ id: "stale-all-booking" })],
      page: 4,
      hasMore: false,
    });
    await loadingMore;

    expect(state).toEqual({
      bookings: [booking({ id: "current-booking" })],
      page: 3,
      hasMore: true,
      isLoadingMore: true,
    });
  });

  it("ignores load-more errors and finalization after switching away and back", async () => {
    let activeStatus: "ALL" | "PENDING" = "ALL";
    let activeGeneration = 0;
    const requestStatus = activeStatus;
    const requestGeneration = activeGeneration;
    const state = { moreError: null as string | null, isLoadingMore: true };
    let rejectOldPage!: (error: Error) => void;
    const oldPage = new Promise<never>((_resolve, reject) => {
      rejectOldPage = reject;
    });
    const isCurrent = () =>
      isCurrentAdminBookingsRequest(
        requestStatus,
        activeStatus,
        requestGeneration,
        activeGeneration,
      );
    const loadingMore = settleAdminBookingsPaginationRequest(
      oldPage,
      isCurrent,
      {
        onSuccess: () => {},
        onError: (error) => {
          state.moreError =
            error instanceof Error ? error.message : "Could not load more bookings.";
        },
        onFinally: () => {
          state.isLoadingMore = false;
        },
      },
    );
    activeStatus = "PENDING";
    activeGeneration += 1;
    activeStatus = "ALL";
    activeGeneration += 1;
    rejectOldPage(new Error("Stale request failed"));
    await loadingMore;

    expect(state).toEqual({ moreError: null, isLoadingMore: true });
  });
});

describe("AdminBookingDetailContent", () => {
  it("shows loading, not-found/error, and a return path", () => {
    const loading = renderToStaticMarkup(
      <AdminBookingDetailContent
        booking={null}
        isLoading
        loadError={null}
        onRetry={vi.fn()}
      />,
    );
    expect(loading).toContain("Loading booking...");

    const missing = renderToStaticMarkup(
      <AdminBookingDetailContent
        booking={null}
        isLoading={false}
        loadError="Booking not found."
        onRetry={vi.fn()}
      />,
    );
    expect(missing).toContain("Booking not found.");
    expect(missing).toContain("Try again");
    expect(missing).toContain('href="/admin/bookings"');
  });

  it("shows only authorized operational details and no unsupported actions", () => {
    const markup = renderToStaticMarkup(
      <AdminBookingDetailContent
        booking={booking()}
        isLoading={false}
        loadError={null}
        onRetry={vi.fn()}
      />,
    );
    expect(markup).toContain("Green Hostel");
    expect(markup).toContain("Lahore");
    expect(markup).toContain("Room reference");
    expect(markup).toContain("No admin action is available on this screen.");
    expect(markup).not.toContain("Cancel booking");
    expect(markup).not.toContain("Confirm booking");
    expect(markup).not.toContain("Decline booking");
    expect(markup).not.toContain("Ayesha Khan");
    expect(markup).not.toContain("student@example.test");
  });
});
