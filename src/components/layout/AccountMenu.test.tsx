import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSession } from "next-auth/react";
import { AccountMenu } from "./AccountMenu";

type TestRole = "STUDENT" | "OWNER" | "ADMIN";

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
  signOut: vi.fn(),
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

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuSeparator: () => <hr />,
}));

function mockSession(role: TestRole) {
  vi.mocked(useSession).mockReturnValue({
    data: {
      user: {
        id: `${role.toLowerCase()}-1`,
        name: role,
        email: `${role.toLowerCase()}@example.com`,
        role,
        emailVerified: null,
        tokenVersion: 0,
      },
      expires: "2026-06-24T00:00:00.000Z",
    },
    status: "authenticated",
    update: vi.fn(),
  });
}

describe("AccountMenu role navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows only student account links for students", () => {
    mockSession("STUDENT");

    const markup = renderToStaticMarkup(<AccountMenu />);

    expect(markup).toContain("My bookings");
    expect(markup).toContain("Saved hostels");
    expect(markup).toContain("/dashboard/bookings");
    expect(markup).not.toContain("Owner dashboard");
    expect(markup).not.toContain("My listings");
    expect(markup).not.toContain("/owner/");
    expect(markup).not.toContain("Admin panel");
  });

  it("shows owner controls instead of student links for owners", () => {
    mockSession("OWNER");

    const markup = renderToStaticMarkup(<AccountMenu />);

    expect(markup).toContain("Owner dashboard");
    expect(markup).toContain("My listings");
    expect(markup).toContain("/owner/bookings");
    expect(markup).not.toContain("/dashboard/bookings");
    expect(markup).not.toContain("Saved hostels");
    expect(markup).not.toContain("Admin panel");
  });

  it("shows admin controls instead of student or owner links for admins", () => {
    mockSession("ADMIN");

    const markup = renderToStaticMarkup(<AccountMenu />);

    expect(markup).toContain("Admin panel");
    expect(markup).toContain("Verifications");
    expect(markup).toContain("Sync search");
    expect(markup).not.toContain("/dashboard/bookings");
    expect(markup).not.toContain("Saved hostels");
    expect(markup).not.toContain("Owner dashboard");
  });
});
