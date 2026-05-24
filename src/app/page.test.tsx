import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HomePage from "@/app/page";
import { auth } from "@/lib/auth/config";

vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn(),
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
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      }),
    );
  });

  it("does not show the owner listing CTA to signed-in students", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "student-1",
        name: "Student",
        email: "student@example.com",
        role: "STUDENT",
      },
      expires: "2026-06-24T00:00:00.000Z",
    });

    const markup = renderToStaticMarkup(await HomePage());

    expect(markup).not.toContain("List your hostel");
  });

  it("shows trust proof near the search experience", async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const markup = renderToStaticMarkup(await HomePage());

    expect(markup).toContain("Verified hostel listings");
    expect(markup).toContain("Real prices before you call");
    expect(markup).toContain("Secure booking handoff");
  });
});
