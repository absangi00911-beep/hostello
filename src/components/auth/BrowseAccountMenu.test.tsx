import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
      children: React.ReactNode;
      href: string;
    }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@radix-ui/react-dropdown-menu", () => ({
  Root: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Trigger: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
  Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Content: ({ children }: { children: React.ReactNode }) => (
    <div role="menu">{children}</div>
  ),
  Label: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Separator: () => <hr />,
  Item: ({
    asChild,
    children,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & {
    asChild?: boolean;
    children: React.ReactNode;
  }) =>
    asChild ? (
      <>{children}</>
    ) : (
      <div role="menuitem" {...props}>
        {children}
      </div>
    ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("./LoginDialogTrigger", () => ({
  LoginDialogTrigger: ({
    ariaLabel,
    children,
    className,
  }: {
    ariaLabel: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <button aria-label={ariaLabel} className={className}>
      {children}
    </button>
  ),
}));

import { BrowseAccountMenu } from "./BrowseAccountMenu";

describe("BrowseAccountMenu", () => {
  it("keeps the guest control sign-in-only", () => {
    const markup = renderToStaticMarkup(<BrowseAccountMenu user={null} />);

    expect(markup).toContain('aria-label="Sign in"');
    expect(markup).not.toContain('href="/');
  });

  it("shows a signed-in user's photo avatar when one is available", () => {
    const markup = renderToStaticMarkup(
      <BrowseAccountMenu
        user={{
          name: "Alex Student",
          email: "student@example.com",
          role: "STUDENT",
          avatar: "https://images.unsplash.com/student.jpg",
        }}
      />,
    );

    expect(markup).toContain('src="https://images.unsplash.com/student.jpg"');
    expect(markup).toContain('alt=""');
    expect(markup).not.toContain(">A</span>");
  });

  it("shows a signed-in user's name and avatar initial in the account trigger", () => {
    const markup = renderToStaticMarkup(
      <BrowseAccountMenu
        user={{
          name: "Alex Student",
          email: "student@example.com",
          role: "STUDENT",
        }}
      />,
    );

    expect(markup).toContain('aria-label="Account menu for Alex Student"');
    const avatarClass = markup
      .match(/<span aria-hidden="true" class="([^"]+)">/)?.[1]
      ?.split(" ");
    expect(avatarClass).toEqual(
      expect.arrayContaining(["h-8", "w-8", "rounded-full", "bg-brand"]),
    );
    expect(markup).not.toContain("browse-account-avatar");
    expect(markup).toContain(">A</span>");
    expect(markup).toContain("Alex Student");
  });

  it("uses the email's local part when the user has no display name", () => {
    const markup = renderToStaticMarkup(
      <BrowseAccountMenu
        user={{ name: null, email: "student@example.com", role: "STUDENT" }}
      />,
    );

    expect(markup).toContain('aria-label="Account menu for student"');
    expect(markup).toContain(">S</span>");
  });

  it.each([
    [
      "STUDENT",
      [
        ["/", "Explore"],
        ["/wishlists", "Wishlists"],
        ["/trips", "Trips"],
        ["/messages", "Messages"],
        ["/profile", "Profile"],
      ],
      [],
    ],
    [
      "OWNER",
      [
        ["/owner", "Dashboard"],
        ["/owner/listings/new", "Create listing"],
        ["/owner/bookings", "Bookings"],
        ["/messages", "Messages"],
        ["/owner/reviews", "Reviews"],
        ["/owner/analytics", "Analytics"],
        ["/owner/earnings", "Earnings"],
        ["/owner/subscription", "Subscription"],
      ],
      ["/", "/wishlists", "/trips", "/profile"],
    ],
    [
      "ADMIN",
      [
        ["/admin", "Admin console"],
        ["/admin/listings", "Listings"],
        ["/admin/verifications", "Verifications"],
        ["/admin/roommate-reports", "Roommate reports"],
        ["/admin/payment-events", "Payment events"],
        ["/admin/refunds", "Refunds"],
        ["/admin/payouts", "Payouts"],
        ["/admin/search-sync", "Search sync"],
      ],
      ["/wishlists", "/trips", "/messages", "/profile", "/owner"],
    ],
  ] as const)(
    "shows only role-available destinations in the %s account menu",
    (role, visibleLinks, hiddenLinks) => {
      const markup = renderToStaticMarkup(
        <BrowseAccountMenu user={{ role }} />,
      );

      for (const [href, label] of visibleLinks) {
        expect(markup).toContain(`href="${href}"`);
        expect(markup).toContain(`>${label}</span>`);
      }
      for (const href of hiddenLinks) {
        expect(markup).not.toContain(`href="${href}"`);
      }
    },
  );

  it.each(["STUDENT", "OWNER", "ADMIN"] as const)(
    "links the notification center from the %s account menu",
    (role) => {
      const markup = renderToStaticMarkup(
        <BrowseAccountMenu user={{ role }} />,
      );

      expect(markup).toContain('href="/notifications"');
      expect(markup).toContain("Notifications");
      expect(markup).not.toContain('data-testid="unread-badge"');
    },
  );

  it("keeps the guest control free of the notification link", () => {
    const markup = renderToStaticMarkup(<BrowseAccountMenu user={null} />);

    expect(markup).not.toContain("/notifications");
  });

  it.each([
    ["OWNER", true],
    ["STUDENT", false],
    ["ADMIN", false],
  ] as const)("shows the owner dashboard only to owners (%s)", (role, shown) => {
    const markup = renderToStaticMarkup(<BrowseAccountMenu user={{ role }} />);

    expect(
      /<a\b(?=[^>]*href="\/owner")[^>]*><span>Dashboard<\/span>/.test(markup),
    ).toBe(shown);
  });

  it.each([
    ["ADMIN", true],
    ["OWNER", false],
    ["STUDENT", false],
  ] as const)("shows the admin console link only to admins (%s)", (role, shown) => {
    const markup = renderToStaticMarkup(<BrowseAccountMenu user={{ role }} />);

    expect(
      /<a\b(?=[^>]*href="\/admin")[^>]*><span>Admin console<\/span>/.test(
        markup,
      ),
    ).toBe(shown);
  });

  it("uses a 44px keyboard-focusable sign-in target for guests", () => {
    const markup = renderToStaticMarkup(<BrowseAccountMenu user={null} />);
    const signIn = markup.match(/<button\b[^>]*aria-label="Sign in"[^>]*>/)?.[0];

    expect(signIn).toContain("size-11");
    expect(signIn).toContain("focus-visible:outline");
  });

  it("keeps the signed-in account trigger at least 44px and visibly focused", () => {
    const markup = renderToStaticMarkup(
      <BrowseAccountMenu
        user={{ name: "Alex Student", role: "STUDENT" }}
      />,
    );
    const accountTrigger = markup.match(
      /<button\b(?=[^>]*aria-label="Account menu for Alex Student")[^>]*>/,
    )?.[0];

    expect(accountTrigger).toContain("min-h-11");
    expect(accountTrigger).toContain("focus-visible:outline");
  });

  it("gives owner menu links 44px keyboard-focusable targets", () => {
    const markup = renderToStaticMarkup(
      <BrowseAccountMenu user={{ role: "OWNER" }} />,
    );
    const bookingsLink = markup.match(
      /<a\b(?=[^>]*href="\/owner\/bookings")[^>]*>/,
    )?.[0];

    expect(bookingsLink).toContain("min-h-11");
    expect(bookingsLink).toContain("focus-visible:outline");
  });
});
