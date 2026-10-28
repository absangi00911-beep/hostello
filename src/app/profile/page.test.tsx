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

import ProfileRoute from "./page";

describe("ProfileRoute", () => {
  beforeEach(() => {
    mocks.auth.mockReset();
  });

  it("redirects anonymous users to login with a safe profile callback", async () => {
    mocks.auth.mockResolvedValue(null);

    await expect(ProfileRoute()).rejects.toThrow(
      "NEXT_REDIRECT:/login?callbackUrl=%2Fprofile",
    );
  });

  it("denies users who are not students", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "owner-1", role: "OWNER" } });

    await expect(ProfileRoute()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders the student profile page", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "student-1", role: "STUDENT" } });

    const markup = renderToStaticMarkup(await ProfileRoute());

    expect(markup).toContain("Loading profile...");
    expect(markup).toContain('aria-label="Student navigation"');
  });
});
