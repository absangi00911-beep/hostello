import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSession } from "next-auth/react";
import { Navbar } from "./Navbar";

type TestRole = "STUDENT" | "OWNER" | "ADMIN";

const mocks = vi.hoisted(() => ({ pathname: "/" }));

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
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

describe("Navbar mobile navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.pathname = "/";
  });

  it("keeps the homepage search focused without a city selector", () => {
    mockSession("STUDENT");

    const markup = renderToStaticMarkup(<Navbar />);

    expect(markup).toContain("Start your search");
    expect(markup).not.toContain(">City</button>");
    expect(markup).not.toContain(">All cities</span>");
  });

  it("omits the city selector from the navbar on interior pages", () => {
    mocks.pathname = "/dashboard/saved";

    const markup = renderToStaticMarkup(<Navbar />);

    expect(markup).not.toContain(">City</button>");
    expect(markup).not.toContain(">All cities</span>");
  });

  it("does not add a city selector for signed-out visitors on interior pages", () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: vi.fn(),
    });
    mocks.pathname = "/hostels";

    const markup = renderToStaticMarkup(<Navbar />);

    expect(markup).not.toContain(">City</button>");
    expect(markup).not.toContain(">All cities</span>");
  });

  it("shows student links in the top navigation menu", () => {
    mockSession("STUDENT");

    const markup = renderToStaticMarkup(<Navbar />);

    expect(markup).toContain('aria-label="Mobile navigation"');
    expect(markup).toContain('aria-label="Open navigation menu"');
    expect(markup).toContain(">Quick links</h2>");
    expect(markup).toContain(">More</h2>");
    expect(markup).toContain(">List your hostel</a>");
    expect(markup).toContain('href="/dashboard/saved"');
    expect(markup).toContain('href="/dashboard/messages"');
    expect(markup).not.toContain('href="/owner/dashboard"');
    expect(markup).not.toContain('href="/owner/listings"');
    expect(markup).not.toContain('href="/owner/bookings"');
    expect(markup).not.toContain('href="/owner/messages"');
    expect(markup).not.toContain('href="/admin"');
    expect(markup).not.toContain("fixed bottom-0");
  });

  it("labels the unauthenticated account link as sign in", () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: vi.fn(),
    });

    const markup = renderToStaticMarkup(<Navbar />);

    expect(markup).toContain(">Sign in</span>");
    expect(markup).not.toContain(">Account</span>");
  });

  it("shows owner links in the top navigation menu", () => {
    mockSession("OWNER");

    const markup = renderToStaticMarkup(<Navbar />);

    expect(markup).toContain('href="/owner/dashboard"');
    expect(markup).toContain('href="/owner/listings"');
    expect(markup).toContain('href="/owner/bookings"');
    expect(markup).not.toContain('href="/dashboard/saved"');
    expect(markup).not.toContain('href="/admin"');
  });

  it("shows admin links in the top navigation menu", () => {
    mockSession("ADMIN");

    const markup = renderToStaticMarkup(<Navbar />);

    expect(markup).toContain('href="/admin"');
    expect(markup).toContain('href="/admin/listings"');
    expect(markup).toContain('href="/admin/verifications"');
    expect(markup).not.toContain('href="/dashboard/saved"');
    expect(markup).not.toContain('href="/owner/dashboard"');
  });
});
