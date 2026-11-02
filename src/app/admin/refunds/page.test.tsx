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

import AdminRefundsRoute from "./page";

describe("AdminRefundsRoute", () => {
  beforeEach(() => mocks.auth.mockReset());

  it("redirects anonymous users to login with a return path", async () => {
    mocks.auth.mockResolvedValue(null);
    await expect(AdminRefundsRoute()).rejects.toThrow(
      "NEXT_REDIRECT:/login?callbackUrl=%2Fadmin%2Frefunds",
    );
  });

  it.each(["STUDENT", "OWNER"])("hides the page from %s accounts", async (role) => {
    mocks.auth.mockResolvedValue({ user: { id: "u1", role } });
    await expect(AdminRefundsRoute()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders the page for admins", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "a1", role: "ADMIN", name: "Admin" } });
    const markup = renderToStaticMarkup(await AdminRefundsRoute());
    expect(markup).toContain("Refunds");
    expect(markup).toContain("Loading cancelled bookings...");
  });
});
