import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), getCityLinks: vi.fn(), loadInitialHomeHostels: vi.fn() }));

vi.mock("@/lib/auth/config", () => ({ auth: mocks.auth }));
vi.mock("@/lib/city-links", () => ({ getCityLinks: mocks.getCityLinks }));
vi.mock("./load-initial-home-hostels", () => ({ loadInitialHomeHostels: mocks.loadInitialHomeHostels }));
vi.mock("@/components/home/ProductHome", () => ({
  default: ({
    accountUser,
    cityLinks,
    initialHostels,
  }: {
    accountUser:
      | {
          name?: string | null;
          email?: string | null;
        role?: "STUDENT" | "OWNER" | "ADMIN";
        }
      | null;
    cityLinks?: React.ReactNode;
    initialHostels?: { name: string }[] | null;
  }) => (
    <div>
      {accountUser?.name ?? "Guest"}
      {accountUser?.email}
    {accountUser?.role}
    {cityLinks}
    {initialHostels === null ? "browser-loads" : initialHostels?.map((h) => h.name).join(",")}
  </div>
  ),
}));

import HomePage from "./page";

describe("HomePage", () => {
  beforeEach(() => {
    mocks.getCityLinks.mockResolvedValue([]);
    mocks.loadInitialHomeHostels.mockResolvedValue(null);
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

  it("passes the server-rendered listings to the home page", async () => {
    mocks.auth.mockResolvedValue(null);
    mocks.loadInitialHomeHostels.mockResolvedValue([{ name: "Green View" }, { name: "Blue Door" }]);

    const markup = renderToStaticMarkup(await HomePage());

    expect(markup).toContain("Green View,Blue Door");
  });

  it("tells the home page to load listings itself when the server could not", async () => {
    mocks.auth.mockResolvedValue(null);

    expect(renderToStaticMarkup(await HomePage())).toContain("browser-loads");
  });
});
