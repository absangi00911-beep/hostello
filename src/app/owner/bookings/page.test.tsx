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

import OwnerBookingsRoute from "./page";

describe("OwnerBookingsRoute", () => {
  beforeEach(() => mocks.auth.mockReset());

  it("redirects anonymous users to login with a return path", async () => {
    mocks.auth.mockResolvedValue(null);

    await expect(OwnerBookingsRoute()).rejects.toThrow(
      "NEXT_REDIRECT:/login?callbackUrl=%2Fowner%2Fbookings",
    );
  });

  it.each(["STUDENT", "ADMIN"])("hides the page from %s accounts", async (role) => {
    mocks.auth.mockResolvedValue({ user: { id: "u1", role } });

    await expect(OwnerBookingsRoute()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders the queue for owners", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "o1", role: "OWNER", name: "Sana" } });

    const markup = renderToStaticMarkup(await OwnerBookingsRoute());

    expect(markup).toContain("Bookings");
    expect(markup).toContain("Needs response");
  });
});
