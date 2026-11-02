import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn() }));

vi.mock("@/lib/auth/config", () => ({ auth: mocks.auth }));
vi.mock("next/navigation", () => ({
  redirect: (destination: string) => {
    throw new Error(`NEXT_REDIRECT:${destination}`);
  },
}));

import SignupPage from "./page";

describe("SignupPage", () => {
  beforeEach(() => {
    mocks.auth.mockReset();
  });

  it("redirects signed-in users home", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "u1", role: "STUDENT" } });

    await expect(
      SignupPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("NEXT_REDIRECT:/");
  });

  it("defaults to the student role", async () => {
    mocks.auth.mockResolvedValue(null);

    const markup = renderToStaticMarkup(
      await SignupPage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain("Create your account");
    expect(markup).toMatch(/<input[^>]*checked[^>]*value="STUDENT"|<input[^>]*value="STUDENT"[^>]*checked/);
  });

  it("preselects the owner role from the query string", async () => {
    mocks.auth.mockResolvedValue(null);

    const markup = renderToStaticMarkup(
      await SignupPage({ searchParams: Promise.resolve({ role: "OWNER" }) }),
    );

    expect(markup).toMatch(/<input[^>]*checked[^>]*value="OWNER"|<input[^>]*value="OWNER"[^>]*checked/);
  });
});
