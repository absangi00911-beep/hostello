import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSession } from "next-auth/react";
import { Footer } from "@/components/Footer";

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("Footer role-based links", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not show owner listing links to signed-in students", () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          id: "student-1",
          name: "Student",
          email: "student@example.com",
          role: "STUDENT",
          emailVerified: null,
          tokenVersion: 0,
        },
        expires: "2026-06-24T00:00:00.000Z",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    const markup = renderToStaticMarkup(<Footer />);

    expect(markup).not.toContain("List your hostel");
    expect(markup).not.toContain('href="/register?role=OWNER"');
    expect(markup).not.toContain('href="/owner/listings/new"');
  });

  it("does not flash owner listing links while the session is loading", () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: "loading",
      update: vi.fn(),
    });

    const markup = renderToStaticMarkup(<Footer />);

    expect(markup).not.toContain("List your hostel");
  });

  it("links signed-in owners directly to the new listing flow", () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          id: "owner-1",
          name: "Owner",
          email: "owner@example.com",
          role: "OWNER",
          emailVerified: null,
          tokenVersion: 0,
        },
        expires: "2026-06-24T00:00:00.000Z",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    const markup = renderToStaticMarkup(<Footer />);

    expect(markup).toContain("List your hostel");
    expect(markup).toContain('href="/owner/listings/new"');
    expect(markup).not.toContain('href="/register?role=OWNER"');
  });
});
