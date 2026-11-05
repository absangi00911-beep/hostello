import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn() }));

vi.mock("@/lib/auth/config", () => ({ auth: mocks.auth }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  redirect: (destination: string) => {
    throw new Error(`NEXT_REDIRECT:${destination}`);
  },
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

import AdminBookingsRoute from "./page";

describe("AdminBookingsRoute", () => {
  beforeEach(() => mocks.auth.mockReset());

  it("redirects anonymous users to login", async () => {
    mocks.auth.mockResolvedValue(null);
    await expect(AdminBookingsRoute()).rejects.toThrow(
      "NEXT_REDIRECT:/login?callbackUrl=%2Fadmin%2Fbookings",
    );
  });

  it.each(["STUDENT", "OWNER"])("hides the page from %s accounts", async (role) => {
    mocks.auth.mockResolvedValue({ user: { id: "u1", role } });
    await expect(AdminBookingsRoute()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders the queue for an admin", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "a1", role: "ADMIN" } });
    const markup = renderToStaticMarkup(await AdminBookingsRoute());
    expect(markup).toContain("Loading bookings...");
  });
});
