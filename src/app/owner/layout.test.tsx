import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OwnerRootLayout from "./layout";
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

vi.mock("@/components/layout/OwnerLayout", () => ({
  OwnerLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="owner-layout">{children}</div>
  ),
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

describe("OwnerRootLayout role guard", () => {
  const mockedAuth = vi.mocked(auth);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the owner interface for owners", async () => {
    mockedAuth.mockResolvedValue(sessionFor("OWNER"));

    const markup = renderToStaticMarkup(
      await OwnerRootLayout({ children: <p>Owner content</p> }),
    );

    expect(markup).toContain("Owner content");
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects admins to the admin interface", async () => {
    mockedAuth.mockResolvedValue(sessionFor("ADMIN"));

    await expect(
      OwnerRootLayout({ children: <p>Owner content</p> }),
    ).rejects.toThrow("NEXT_REDIRECT:/admin");
  });

  it("redirects students away from the owner interface", async () => {
    mockedAuth.mockResolvedValue(sessionFor("STUDENT"));

    await expect(
      OwnerRootLayout({ children: <p>Owner content</p> }),
    ).rejects.toThrow("NEXT_REDIRECT:/");
  });
});
