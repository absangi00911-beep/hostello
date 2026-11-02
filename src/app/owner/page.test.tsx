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

import OwnerDashboardRoute from "./page";

describe("OwnerDashboardRoute", () => {
  beforeEach(() => {
    mocks.auth.mockReset();
  });

  it("redirects anonymous users to login with an owner callback", async () => {
    mocks.auth.mockResolvedValue(null);

    await expect(OwnerDashboardRoute()).rejects.toThrow(
      "NEXT_REDIRECT:/login?callbackUrl=%2Fowner",
    );
  });

  it.each(["STUDENT", "ADMIN"])("hides the dashboard from %s accounts", async (role) => {
    mocks.auth.mockResolvedValue({ user: { id: "u1", role } });

    await expect(OwnerDashboardRoute()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders the dashboard with the owner's name", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "o1", role: "OWNER", name: "Sana Owner", email: "o@example.com" },
    });

    const markup = renderToStaticMarkup(await OwnerDashboardRoute());

    expect(markup).toContain("Host dashboard");
    expect(markup).toContain("Welcome back, Sana Owner");
    expect(markup).toContain("Loading listings...");
  });
});
