import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSession } from "next-auth/react";
import { Navbar } from "./Navbar";

type TestRole = "STUDENT" | "OWNER" | "ADMIN";

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn() }),
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

vi.mock("./layout/NotificationBell", () => ({
  NotificationBell: () => <button>Notifications</button>,
}));

vi.mock("./layout/AccountMenu", () => ({
  AccountMenu: () => <button>Account menu</button>,
}));

vi.mock("./layout/CitySelector", () => ({
  CitySelector: () => <button>City</button>,
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

describe("Navbar mobile tabs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows student mobile tabs for students", () => {
    mockSession("STUDENT");

    const markup = renderToStaticMarkup(<Navbar />);

    expect(markup).toContain('href="/dashboard/saved"');
    expect(markup).toContain('href="/dashboard/messages"');
    expect(markup).not.toContain('href="/owner/dashboard"');
    expect(markup).not.toContain('href="/owner/listings"');
    expect(markup).not.toContain('href="/owner/bookings"');
    expect(markup).not.toContain('href="/owner/messages"');
    expect(markup).not.toContain('href="/admin"');
  });

  it("shows owner mobile tabs for owners", () => {
    mockSession("OWNER");

    const markup = renderToStaticMarkup(<Navbar />);

    expect(markup).toContain('href="/owner/dashboard"');
    expect(markup).toContain('href="/owner/listings"');
    expect(markup).toContain('href="/owner/bookings"');
    expect(markup).not.toContain('href="/dashboard/saved"');
    expect(markup).not.toContain('href="/admin"');
  });

  it("shows admin mobile tabs for admins", () => {
    mockSession("ADMIN");

    const markup = renderToStaticMarkup(<Navbar />);

    expect(markup).toContain('href="/admin"');
    expect(markup).toContain('href="/admin/listings"');
    expect(markup).toContain('href="/admin/verifications"');
    expect(markup).not.toContain('href="/dashboard/saved"');
    expect(markup).not.toContain('href="/owner/dashboard"');
  });
});
