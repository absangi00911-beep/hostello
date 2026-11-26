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

import OwnerAnalyticsRoute, { metadata } from "./page";

describe("OwnerAnalyticsRoute", () => {
  beforeEach(() => mocks.auth.mockReset());

  it("uses the page-specific browser title", () => {
    expect(metadata.title).toBe("Analytics");
  });

  it("renders the owner analytics page in the workspace shell", async () => {
    mocks.auth.mockResolvedValue({
      user: {
        id: "o1",
        role: "OWNER",
        name: "Sana",
        email: "sana@example.com",
      },
    });

    const markup = renderToStaticMarkup(await OwnerAnalyticsRoute());

    expect(markup).toContain('aria-label="Workspace navigation"');
    expect(markup).toContain("Analytics");
  });

  it("redirects admins to the admin console instead of showing an owner route", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "a1", role: "ADMIN", name: "Admin", email: "admin@example.com" },
    });

    await expect(OwnerAnalyticsRoute()).rejects.toThrow("NEXT_REDIRECT:/admin");
  });
});
