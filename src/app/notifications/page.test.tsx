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

  it("encodes hostel ids and never returns external URLs", () => {
    const item = { ...base, type: "PRICE_ALERT", hostelId: "a/b?c" };

    expect(getNotificationHref(item, "STUDENT")).toBe("/hostels/a%2Fb%3Fc");
  });
});
