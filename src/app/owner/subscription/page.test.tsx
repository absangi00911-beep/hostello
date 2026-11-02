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

import OwnerSubscriptionRoute from "./page";

const props = { searchParams: Promise.resolve({}) };

describe("OwnerSubscriptionRoute", () => {
  beforeEach(() => mocks.auth.mockReset());

  it("redirects anonymous users to login with a return path", async () => {
    mocks.auth.mockResolvedValue(null);
    await expect(OwnerSubscriptionRoute(props)).rejects.toThrow(
      "NEXT_REDIRECT:/login?callbackUrl=%2Fowner%2Fsubscription",
    );
  });

  it.each(["STUDENT", "ADMIN"])("hides the page from %s accounts", async (role) => {
    mocks.auth.mockResolvedValue({ user: { id: "u1", role } });
    await expect(OwnerSubscriptionRoute(props)).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders the subscription page for owners", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "o1", role: "OWNER", name: "Sana" } });
    const markup = renderToStaticMarkup(await OwnerSubscriptionRoute(props));
    expect(markup).toContain("Subscription");
    expect(markup).toContain("Loading subscription...");
  });
});
