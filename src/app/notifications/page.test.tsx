import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn() }));

vi.mock("@/lib/auth/config", () => ({ auth: mocks.auth }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  redirect: (destination: string) => {
    throw new Error(`NEXT_REDIRECT:${destination}`);
  },
}));

import NotificationsRoute from "./page";
import { getNotificationHref } from "@/components/notifications/NotificationsPage";

describe("NotificationsRoute", () => {
  beforeEach(() => {
    mocks.auth.mockReset();
  });

  it("redirects anonymous users to login with a notifications callback", async () => {
    mocks.auth.mockResolvedValue(null);

    await expect(NotificationsRoute()).rejects.toThrow(
      "NEXT_REDIRECT:/login?callbackUrl=%2Fnotifications",
    );
  });

  it("renders the notification center for any signed-in role", async () => {
    for (const role of ["STUDENT", "OWNER", "ADMIN"]) {
      mocks.auth.mockResolvedValue({ user: { id: "u1", role } });

      const markup = renderToStaticMarkup(await NotificationsRoute());

      expect(markup).toContain("Notifications");
      expect(markup).toContain("Loading notifications...");
    }
  });
});

describe("getNotificationHref", () => {
  const base = { bookingId: null, hostelId: null };

  it("links messages for students and owners but not admins", () => {
    const item = { ...base, type: "MESSAGE_RECEIVED" };

    expect(getNotificationHref(item, "STUDENT")).toBe("/messages");
    expect(getNotificationHref(item, "OWNER")).toBe("/messages");
    expect(getNotificationHref(item, "ADMIN")).toBeNull();
  });

  it("links student booking notifications to trips only", () => {
    const item = { ...base, type: "BOOKING_CONFIRMED", bookingId: "b1" };

    expect(getNotificationHref(item, "STUDENT")).toBe("/trips");
    expect(getNotificationHref(item, "OWNER")).toBeNull();
  });

  it("links only known notification types to destinations for the current role", () => {
    expect(
      getNotificationHref(
        { ...base, type: "BOOKING_REQUEST", bookingId: "b1" },
        "OWNER",
      ),
    ).toBe("/owner/bookings");
    expect(
      getNotificationHref(
        { ...base, type: "BOOKING_CONFIRMED", bookingId: "b1" },
        "STUDENT",
      ),
    ).toBe("/trips");
    expect(
      getNotificationHref(
        { ...base, type: "REVIEW_RECEIVED" },
        "OWNER",
      ),
    ).toBe("/owner/reviews");
    expect(
      getNotificationHref(
        { ...base, type: "HOSTEL_APPROVED" },
        "STUDENT",
      ),
    ).toBeNull();
  });

  it("does not use identifiers from unknown notification types as destinations", () => {
    const item = {
      type: "UNRECOGNIZED",
      bookingId: "booking-from-payload",
      hostelId: "hostel-from-payload",
    };

    expect(getNotificationHref(item, "STUDENT")).toBeNull();
    expect(getNotificationHref(item, "OWNER")).toBeNull();
    expect(getNotificationHref(item, "ADMIN")).toBeNull();
  });

  it("links valid hostel identifiers only for student price alerts", () => {
    const item = { ...base, type: "PRICE_ALERT", hostelId: "hostel_123-abc" };

    expect(getNotificationHref(item, "STUDENT")).toBe("/hostels/hostel_123-abc");
    expect(getNotificationHref(item, "OWNER")).toBeNull();
  });

  it("links availability alerts to the authenticated student management screen", () => {
    const item = { ...base, type: "AVAILABILITY_ALERT" };

    expect(getNotificationHref(item, "STUDENT")).toBe("/student/availability-alerts");
    expect(getNotificationHref(item, "OWNER")).toBeNull();
    expect(getNotificationHref(item, "ADMIN")).toBeNull();
  });

  it("links SEARCH alerts to their saved public results and keeps HOSTEL alerts in the manager", () => {
    const searchItem = {
      ...base,
      type: "AVAILABILITY_ALERT",
      availabilityAlert: {
        type: "SEARCH" as const,
        criteria: {
          city: "Lahore",
          gender: "FEMALE" as const,
          amenities: ["wifi"],
        },
        checkIn: "2030-03-20T00:00:00.000Z",
        checkOut: "2030-03-22T00:00:00.000Z",
        guests: 2,
      },
    };
    const hostelItem = {
      ...base,
      type: "AVAILABILITY_ALERT",
      availabilityAlert: {
        type: "HOSTEL" as const,
        criteria: { hostelId: "hostel_1" },
        checkIn: "2030-03-20T00:00:00.000Z",
        checkOut: "2030-03-22T00:00:00.000Z",
        guests: 2,
      },
    };

    const href = getNotificationHref(searchItem, "STUDENT");
    expect(href).toMatch(/^\/search\?/);
    const search = new URL(href!, "https://hostello.test");
    expect(search.origin).toBe("https://hostello.test");
    expect(search.searchParams.get("city")).toBe("Lahore");
    expect(search.searchParams.get("gender")).toBe("FEMALE");
    expect(search.searchParams.get("amenities")).toBe("wifi");
    expect(search.searchParams.get("moveInDate")).toBe("2030-03-20");
    expect(search.searchParams.get("checkOut")).toBe("2030-03-22");
    expect(search.searchParams.get("guests")).toBe("2");
    expect(getNotificationHref(hostelItem, "STUDENT")).toBe(
      "/student/availability-alerts",
    );
  });

  it("falls back to the alert manager for invalid SEARCH alert data", () => {
    expect(
      getNotificationHref(
        {
          ...base,
          type: "AVAILABILITY_ALERT",
          availabilityAlert: {
            type: "SEARCH",
            criteria: { amenities: ["untrusted"] },
            checkIn: "2030-03-20",
            checkOut: "2030-03-22",
            guests: 2,
          },
        },
        "STUDENT",
      ),
    ).toBe("/student/availability-alerts");
  });

  it("does not construct a route from path-like or external hostel identifiers", () => {
    expect(
      getNotificationHref(
        { ...base, type: "PRICE_ALERT", hostelId: "https://evil.example/path" },
        "STUDENT",
      ),
    ).toBeNull();
  });
});
