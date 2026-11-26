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

import AdminRoute from "./page";

describe("AdminRoute", () => {
  beforeEach(() => mocks.auth.mockReset());

  it("redirects anonymous users to login with a return path", async () => {
    mocks.auth.mockResolvedValue(null);
    await expect(AdminRoute()).rejects.toThrow(
      "NEXT_REDIRECT:/login?callbackUrl=%2Fadmin",
    );
  });

  it("redirects student accounts to their profile", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "u1", role: "STUDENT" } });
    await expect(AdminRoute()).rejects.toThrow("NEXT_REDIRECT:/profile");
  });

  it("redirects owner accounts to their dashboard", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "u1", role: "OWNER" } });
    await expect(AdminRoute()).rejects.toThrow("NEXT_REDIRECT:/owner");
  });

  it("renders the page for admins", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "a1", role: "ADMIN", name: "Admin" } });
    const markup = renderToStaticMarkup(await AdminRoute());
    expect(markup).toContain('aria-label="Workspace navigation"');
    expect(markup).toMatch(
      /<a\b(?=[^>]*href="\/admin")(?=[^>]*aria-current="page")[^>]*>/,
    );
    expect(markup).toContain("Admin console");
    expect(markup).toContain("Loading overview...");
  });
});
