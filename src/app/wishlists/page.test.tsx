import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn() }));

vi.mock("@/lib/auth/config", () => ({ auth: mocks.auth }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  redirect: (destination: string) => {
    throw new Error(`NEXT_REDIRECT:${destination}`);
  },
}));

import WishlistsRoute from "./page";

describe("WishlistsRoute", () => {
  beforeEach(() => {
    mocks.auth.mockReset();
  });

  it("redirects anonymous users to login with a safe wishlist callback", async () => {
    mocks.auth.mockResolvedValue(null);

    await expect(WishlistsRoute()).rejects.toThrow(
      "NEXT_REDIRECT:/login?callbackUrl=%2Fwishlists",
    );
  });

  it("denies users who are not students", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "owner-1", role: "OWNER" } });

    await expect(WishlistsRoute()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders the student wishlists page", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "student-1", role: "STUDENT" } });

    const markup = renderToStaticMarkup(await WishlistsRoute());

    expect(markup).toContain("Loading saved hostels");
    expect(markup).toContain('aria-label="Student navigation"');
  });
});
