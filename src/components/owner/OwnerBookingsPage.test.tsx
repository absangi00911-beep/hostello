import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  OwnerBookingsContent,
  type OwnerBookingsContentProps,
  OwnerBookingsPage,
} from "./OwnerBookingsPage";
import type { OwnerBooking } from "./ownerBookings";

const hookHarness = vi.hoisted(() => ({
  active: false,
  cursor: 0,
  states: [] as unknown[],
}));
const fetchMock = vi.hoisted(() => vi.fn());

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  const useState = ((initial: unknown) => {
    if (!hookHarness.active) return actual.useState(initial as never);

    const index = hookHarness.cursor++;
    if (index >= hookHarness.states.length) {
      hookHarness.states[index] =
        typeof initial === "function" ? (initial as () => unknown)() : initial;
    }

    return [
      hookHarness.states[index],
      (next: unknown) => {
        hookHarness.states[index] =
          typeof next === "function"
            ? (next as (previous: unknown) => unknown)(hookHarness.states[index])
            : next;
      },
    ];
  }) as typeof actual.useState;

  return {
    ...actual,
    useState,
    useEffect: (...args: Parameters<typeof actual.useEffect>) => {
      if (!hookHarness.active) actual.useEffect(...args);
    },
    useCallback: ((callback: unknown) => callback) as typeof actual.useCallback,
  };
});

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

function renderOwnerBookingsPage() {
  hookHarness.cursor = 0;
  hookHarness.active = true;
  try {
    return OwnerBookingsPage();
  } finally {
    hookHarness.active = false;
  }
}

function resetOwnerBookingsPage(bookingItem: OwnerBooking) {
  hookHarness.states = [
    "PENDING",
    [bookingItem],
    1,
    1,
    false,
    false,
    false,
    null,
    null,
    0,
    null,
    null,
    null,
    Date.now(),
  ];
  hookHarness.cursor = 0;
  hookHarness.active = false;
}

beforeEach(() => {
  hookHarness.active = false;
  hookHarness.cursor = 0;
  hookHarness.states = [];
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

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

  it("withholds booking decisions while the current state is being refreshed", () => {
    const markup = render({ isLoading: true });

    expect(markup).toContain("Loading bookings...");
    expect(markup).not.toContain("Confirm booking");
    expect(markup).not.toContain(">Decline<");
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

describe("OwnerBookingsPage", () => {
  it("refreshes the paid booking state before allowing a retry after an interrupted decision", async () => {
    const now = Date.now();
    const pendingBooking = booking({
      createdAt: new Date(now).toISOString(),
      ownerResponseDueAt: new Date(now + 5 * 3_600_000).toISOString(),
    });
    resetOwnerBookingsPage(pendingBooking);
    let finishRefresh!: (value: {
      ok: boolean;
      json: () => Promise<unknown>;
    }) => void;
    fetchMock
      .mockRejectedValueOnce(new Error("connection interrupted"))
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishRefresh = resolve;
          }),
      );

    const refreshedResponse = {
      ok: true,
      json: async () => ({
          data: [
            {
              id: pendingBooking.id,
              status: "PENDING",
              checkIn: pendingBooking.checkIn,
              checkOut: pendingBooking.checkOut,
              months: pendingBooking.months,
              guests: pendingBooking.guests,
              total: pendingBooking.total,
              createdAt: pendingBooking.createdAt,
              ownerResponseDueAt: pendingBooking.ownerResponseDueAt,
              hostel: pendingBooking.hostel,
              user: pendingBooking.student,
            },
          ],
          total: 1,
          page: 1,
          hasMore: false,
      }),
    };

    const page = renderOwnerBookingsPage();
    (page.props as OwnerBookingsContentProps).onConfirm(pendingBooking.id);

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const checkingPage = renderOwnerBookingsPage().props as OwnerBookingsContentProps;

    expect(checkingPage).toMatchObject({ isLoading: true, items: [] });
    const checkingMarkup = renderToStaticMarkup(
      <OwnerBookingsContent {...checkingPage} />,
    );
    expect(checkingMarkup).toContain("Loading bookings...");
    expect(checkingMarkup).not.toContain("Confirm booking");
    expect(checkingMarkup).not.toContain(">Decline<");

    finishRefresh(refreshedResponse);
    await vi.waitFor(() => {
      const current = renderOwnerBookingsPage().props as OwnerBookingsContentProps;
      expect(current.items[0]?.status).toBe("PENDING");
      expect(current.isLoading).toBe(false);
    });

    expect(
      renderToStaticMarkup(
        <OwnerBookingsContent
          {...(renderOwnerBookingsPage().props as OwnerBookingsContentProps)}
        />,
      ),
    ).toContain("Confirm booking");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      `/api/bookings/${pendingBooking.id}`,
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/api/bookings?"),
      expect.any(Object),
    );
  });
});
