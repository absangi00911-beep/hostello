import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardLayout from "./layout";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";

type TestRole = "STUDENT" | "OWNER" | "ADMIN";

vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
}));

vi.mock("@/components/layout/PublicLayout", () => ({
  PublicLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="public-layout">{children}</div>
  ),
}));

vi.mock("./DashboardTabs", () => ({
  DashboardTabs: () => <nav>Student dashboard tabs</nav>,
}));

function sessionFor(role: TestRole) {
  return {
    user: {
      id: `${role.toLowerCase()}-1`,
      name: role,
      email: `${role.toLowerCase()}@example.com`,
      role,
    },
    expires: "2026-06-24T00:00:00.000Z",
  };
}

describe("DashboardLayout role guard", () => {
  const mockedAuth = vi.mocked(auth);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the student dashboard for students", async () => {
    mockedAuth.mockResolvedValue(sessionFor("STUDENT"));

    const markup = renderToStaticMarkup(
      await DashboardLayout({ children: <p>Student content</p> }),
    );

    expect(markup).toContain("Student dashboard tabs");
    expect(markup).toContain("Student content");
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects owners away from student dashboard routes", async () => {
    mockedAuth.mockResolvedValue(sessionFor("OWNER"));

    await expect(
      DashboardLayout({ children: <p>Student content</p> }),
    ).rejects.toThrow("NEXT_REDIRECT:/owner/dashboard");
  });

  it("redirects admins away from student dashboard routes", async () => {
    mockedAuth.mockResolvedValue(sessionFor("ADMIN"));

    await expect(
      DashboardLayout({ children: <p>Student content</p> }),
    ).rejects.toThrow("NEXT_REDIRECT:/admin");
  });
});
