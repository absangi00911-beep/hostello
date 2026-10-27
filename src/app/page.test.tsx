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
      {accountUser?.email}
    {accountUser?.role}
  </div>
  ),
}));

import HomePage from "./page";

describe("HomePage", () => {
  it("passes the authenticated user's display details to the browse header", async () => {
    mocks.auth.mockResolvedValue({
      user: {
        name: "Alex Student",
        email: "student@example.com",
        role: "STUDENT",
      },
    });

    const markup = renderToStaticMarkup(await HomePage());

    expect(markup).toContain("Alex Student");
    expect(markup).toContain("student@example.com");
    expect(markup).toContain("STUDENT");
  });

  it("passes an anonymous state when no session exists", async () => {
    mocks.auth.mockResolvedValue(null);

    const markup = renderToStaticMarkup(await HomePage());

    expect(markup).toContain("Guest");
  });
});
