import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HomePage from "@/app/page";
import { auth } from "@/lib/auth/config";

const redirectMock = vi.hoisted(() => vi.fn());

type TestSession = {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role: "STUDENT" | "OWNER" | "ADMIN";
  };
  expires: string;
};

vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/components/layout/PublicLayout", () => ({
  PublicLayout: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/landing/HeroSearch", () => ({
  HeroSearch: () => <form aria-label="Search hostels" />,
}));

vi.mock("@/components/hostel/HostelCard", () => ({
  HostelCard: () => <article />,
}));

describe("HomePage role-based CTAs", () => {
  const mockedAuth = vi.mocked(auth as unknown as () => Promise<TestSession | null>);
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });
    vi.stubGlobal(
      "fetch",
      fetchMock,
    );
  });

  it("sends signed-in students directly to hostel search", async () => {
    mockedAuth.mockResolvedValue({
      user: {
        id: "student-1",
        name: "Student",
        email: "student@example.com",
        role: "STUDENT",
      },
      expires: "2026-06-24T00:00:00.000Z",
    });

    await HomePage();

    expect(redirectMock).toHaveBeenCalledWith("/hostels");
  });

  it("sends signed-in admins directly to the admin workspace", async () => {
    mockedAuth.mockResolvedValue({
      user: {
        id: "admin-1",
        name: "Admin",
        email: "admin@example.com",
        role: "ADMIN",
      },
      expires: "2026-06-24T00:00:00.000Z",
    });

    await HomePage();

    expect(redirectMock).toHaveBeenCalledWith("/admin");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows an owner workspace instead of hostel discovery to signed-in owners", async () => {
    mockedAuth.mockResolvedValue({
      user: {
        id: "owner-1",
        name: "Owner",
        email: "owner@example.com",
        role: "OWNER",
      },
      expires: "2026-06-24T00:00:00.000Z",
    });

    const markup = renderToStaticMarkup(await HomePage());

    expect(fetchMock).not.toHaveBeenCalled();
    expect(markup).toContain("Manage your hostel business");
    expect(markup).toContain("My listings");
    expect(markup).toContain("Add listing");
    expect(markup).not.toContain("Search hostels");
    expect(markup).not.toContain("Browse by city");
    expect(markup).not.toContain("How it works");
  });

  it("shows a premium lifestyle hero with clear CTAs for anonymous visitors", async () => {
    mockedAuth.mockResolvedValue(null);

    const markup = renderToStaticMarkup(await HomePage());

    expect(markup).toContain("Find a room you actually want to live in.");
    expect(markup).toContain("List your hostel");
    expect(markup).toContain("Verified hostel listings");
    expect(markup).toContain("Real prices before you call");
    expect(markup).toContain("Secure booking handoff");
    expect(markup).toContain("text-[color:var(--color-text-inverse)]");
    expect(markup).toContain("text-[length:var(--text-body-sm)]");
    expect(markup.match(/data-image-fallback/g)).toHaveLength(6);
  });
});
