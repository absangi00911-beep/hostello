import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), getListing: vi.fn() }));

vi.mock("@/lib/auth/config", () => ({ auth: mocks.auth }));
vi.mock("@/lib/owner-listing", () => ({ getOwnerListingSummary: mocks.getListing }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  redirect: (destination: string) => {
    throw new Error(`NEXT_REDIRECT:${destination}`);
  },
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

import OwnerBlockedDatesRoute from "./page";

const props = { params: Promise.resolve({ id: "h1" }) };

describe("OwnerBlockedDatesRoute", () => {
  beforeEach(() => {
    mocks.auth.mockReset();
    mocks.getListing.mockReset();
  });

  it("redirects anonymous users to login with a return path", async () => {
    mocks.auth.mockResolvedValue(null);
    await expect(OwnerBlockedDatesRoute(props)).rejects.toThrow(
      "NEXT_REDIRECT:/login?callbackUrl=%2Fowner%2Flistings%2Fh1%2Fblocked-dates",
    );
  });

  it.each(["STUDENT", "ADMIN"])("hides the page from %s accounts", async (role) => {
    mocks.auth.mockResolvedValue({ user: { id: "u1", role } });
    await expect(OwnerBlockedDatesRoute(props)).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mocks.getListing).not.toHaveBeenCalled();
  });

  it("returns not found for listings the owner doesn't have", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "o1", role: "OWNER" } });
    mocks.getListing.mockResolvedValue(null);
    await expect(OwnerBlockedDatesRoute(props)).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mocks.getListing).toHaveBeenCalledWith("o1", "h1");
  });

  it("renders the page for the listing's owner", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "o1", role: "OWNER", name: "Sana" } });
    mocks.getListing.mockResolvedValue({ id: "h1", name: "Green Hostel", status: "ACTIVE" });
    const markup = renderToStaticMarkup(await OwnerBlockedDatesRoute(props));
    expect(markup).toContain("Blocked dates");
    expect(markup).toContain("Green Hostel");
    expect(markup).toContain("Loading blocked dates...");
  });
});
