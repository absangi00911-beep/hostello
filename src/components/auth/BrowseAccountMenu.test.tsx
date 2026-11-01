import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
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
  }: {
    ariaLabel: string;
    children: React.ReactNode;
  }) => <button aria-label={ariaLabel}>{children}</button>,
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
        ["/", "Explore"],
        ["/messages", "Messages"],
      ],
      ["/wishlists", "/trips", "/profile"],
    ],
    [
      "ADMIN",
      [["/", "Explore"]],
      ["/wishlists", "/trips", "/messages", "/profile"],
    ],
  ] as const)(
    "shows only role-available destinations in the %s account menu",
    (role, visibleLinks, hiddenLinks) => {
      const markup = renderToStaticMarkup(
        <BrowseAccountMenu user={{ role }} />,
      );

      for (const [href, label] of visibleLinks) {
        expect(markup).toContain(`href="${href}">${label}</a>`);
      }
      for (const href of hiddenLinks) {
        expect(markup).not.toContain(`href="${href}"`);
      }
    },
  );
});
