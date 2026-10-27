import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn() }));

vi.mock("@/lib/auth/config", () => ({ auth: mocks.auth }));
vi.mock("@/components/home/ProductHome", () => ({
  default: ({
    accountUser,
  }: {
    accountUser:
      | {
          name?: string | null;
          email?: string | null;
          role?: "STUDENT" | "OWNER" | "ADMIN";
        }
      | null;
  }) => (
    <div>
      {accountUser?.name ?? "Guest"}
      {accountUser?.role}
    </div>
  ),
}));
vi.mock("@/components/auth/LoginDialog", () => ({ default: () => null }));

import LoginPage from "./page";

describe("LoginPage", () => {
  it("preserves authenticated header state on the direct login route", async () => {
    mocks.auth.mockResolvedValue({
      user: {
        name: "Alex Student",
        email: "student@example.com",
        role: "STUDENT",
      },
    });

    const markup = renderToStaticMarkup(
      await LoginPage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain("Alex Student");
    expect(markup).toContain("STUDENT");
  });
});
