import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn() }));

vi.mock("@/lib/auth/config", () => ({ auth: mocks.auth }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  redirect: (destination: string) => {
    throw new Error(`NEXT_REDIRECT:${destination}`);
  },
}));

import BookingDetailRoute from "./page";

const props = {
  params: Promise.resolve({ id: "booking-1" }),
  searchParams: Promise.resolve({}),
};

describe("BookingDetailRoute", () => {
  beforeEach(() => {
    mocks.auth.mockReset();
  });

  it("redirects anonymous users to login with a booking callback", async () => {
    mocks.auth.mockResolvedValue(null);

    await expect(BookingDetailRoute(props)).rejects.toThrow(
      "NEXT_REDIRECT:/login?callbackUrl=%2Fbookings%2Fbooking-1",
    );
  });

  it("denies owners and admins", async () => {
    for (const role of ["OWNER", "ADMIN"]) {
      mocks.auth.mockResolvedValue({ user: { id: "u1", role } });

      await expect(BookingDetailRoute(props)).rejects.toThrow("NEXT_NOT_FOUND");
    }
  });

  it("renders the loading state for students", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "s1", role: "STUDENT" } });

    const markup = renderToStaticMarkup(await BookingDetailRoute(props));

    expect(markup).toContain("Loading booking...");
    expect(markup).toContain('aria-label="Student navigation"');
  });
});
