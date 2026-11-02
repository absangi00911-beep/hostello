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

import RoommatesRoute from "./page";

const props = { params: Promise.resolve({ param: "gulberg-stay" }) };

describe("RoommatesRoute", () => {
  beforeEach(() => {
    mocks.auth.mockReset();
  });

  it("redirects anonymous users to login with a roommates callback", async () => {
    mocks.auth.mockResolvedValue(null);

    await expect(RoommatesRoute(props)).rejects.toThrow(
      "NEXT_REDIRECT:/login?callbackUrl=%2Fhostels%2Fgulberg-stay%2Froommates",
    );
  });

  it("denies owners and admins", async () => {
    for (const role of ["OWNER", "ADMIN"]) {
      mocks.auth.mockResolvedValue({ user: { id: "u1", role } });

      await expect(RoommatesRoute(props)).rejects.toThrow("NEXT_NOT_FOUND");
    }
  });

  it("renders the loading state for students", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "s1", role: "STUDENT" } });

    const markup = renderToStaticMarkup(await RoommatesRoute(props));

    expect(markup).toContain("Roommates for this hostel");
    expect(markup).toContain("Loading roommate posts...");
    expect(markup).toContain('href="/hostels/gulberg-stay"');
  });
});
