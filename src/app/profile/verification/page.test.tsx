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

import StudentVerificationRoute from "./page";

describe("StudentVerificationRoute", () => {
  beforeEach(() => {
    mocks.auth.mockReset();
  });

  it("redirects anonymous users to login", async () => {
    mocks.auth.mockResolvedValue(null);

    await expect(StudentVerificationRoute()).rejects.toThrow(
      "NEXT_REDIRECT:/login?callbackUrl=%2Fprofile%2Fverification",
    );
  });

  it("denies non-students", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "o1", role: "OWNER" } });

    await expect(StudentVerificationRoute()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders the loading state for students", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "s1", role: "STUDENT" } });

    const markup = renderToStaticMarkup(await StudentVerificationRoute());

    expect(markup).toContain("Loading verification status...");
  });
});
