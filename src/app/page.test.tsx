import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), getCityLinks: vi.fn() }));

vi.mock("@/lib/auth/config", () => ({ auth: mocks.auth }));
vi.mock("@/lib/city-links", () => ({ getCityLinks: mocks.getCityLinks }));
vi.mock("@/components/home/ProductHome", () => ({
  default: ({
    accountUser,
    cityLinks,
  }: {
    accountUser:
      | {
          name?: string | null;
          email?: string | null;
        role?: "STUDENT" | "OWNER" | "ADMIN";
        }
      | null;
    cityLinks?: React.ReactNode;
  }) => (
    <div>
      {accountUser?.name ?? "Guest"}
      {accountUser?.email}
    {accountUser?.role}
    {cityLinks}
  </div>
  ),
}));

import HomePage from "./page";

describe("HomePage", () => {
  beforeEach(() => {
    mocks.getCityLinks.mockResolvedValue([]);
  });

  it("renders crawlable links to the city pages", async () => {
    mocks.auth.mockResolvedValue(null);
    mocks.getCityLinks.mockResolvedValue([{ slug: "lahore", name: "Lahore", hostelCount: 20 }]);

    const markup = renderToStaticMarkup(await HomePage());

    expect(markup).toContain('href="/hostels-in/lahore"');
    expect(markup).toContain("Hostels in Lahore");
  });

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
