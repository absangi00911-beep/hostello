import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@radix-ui/react-dialog", () => ({
  Root: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Overlay: () => <div />,
  Content: ({
    children,
    onOpenAutoFocus: _onOpenAutoFocus,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & {
    onOpenAutoFocus?: (event: { preventDefault: () => void }) => void;
    children: React.ReactNode;
  }) => (
    <div aria-modal="true" role="dialog" {...props}>
      {children}
    </div>
  ),
  Close: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Title: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  Description: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}));

vi.mock("next-auth/react", () => ({ signIn: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
}));
vi.mock("next/image", () => ({
  default: () => null,
}));
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

import LoginDialog from "./LoginDialog";

function renderLoginDialog({
  emailCodeEnabled = false,
  googleEnabled = false,
}: {
  emailCodeEnabled?: boolean;
  googleEnabled?: boolean;
} = {}) {
  return renderToStaticMarkup(
    <LoginDialog
      callbackUrl="/messages?pendingInquiry=1"
      emailCodeEnabled={emailCodeEnabled}
      googleEnabled={googleEnabled}
      open
      verified={false}
    />,
  );
}

describe("LoginDialog sign-in methods", () => {
  it("always presents email and password sign-in", () => {
    const markup = renderLoginDialog();
    const emailInput = markup.match(
      /<input\b(?=[^>]*name="email")[^>]*>/,
    )?.[0];

    expect(markup).toContain('role="dialog"');
    expect(markup).toContain('name="email"');
    expect(markup).toContain('name="password"');
    expect(emailInput).toContain('autofocus=""');
    expect(markup).toContain(">Log in</button>");
    expect(markup).toContain('href="/signup"');
  });

  it("offers email-code sign-in only when configured", () => {
    expect(renderLoginDialog()).not.toContain("Use one-time code");
    expect(
      renderLoginDialog({ emailCodeEnabled: true }).match(
        /Use password/g,
      ),
    ).toHaveLength(1);
  });

  it("defaults to email-code sign-in when configured", () => {
    const markup = renderLoginDialog({ emailCodeEnabled: true });

    expect(markup).toContain(
      "Enter your email to receive a one-time login code.",
    );
    expect(markup).toContain(">Continue</button>");
    expect(markup).not.toContain('name="password"');
    expect(markup).toContain(">Use password</button>");
  });

  it("offers Google only when both credentials are configured", () => {
    expect(renderLoginDialog()).not.toContain("Continue with Google");
    expect(renderLoginDialog({ googleEnabled: true })).toContain(
      "Continue with Google",
    );
  });

  it("does not present phone OTP as a sign-in method", () => {
    const markup = renderLoginDialog({ emailCodeEnabled: true });

    expect(markup).not.toMatch(/phone|SMS|text message/i);
  });
});

describe("LoginDialog keyboard and focus affordances", () => {
  it("keeps the close control at least 44px and visibly focused", () => {
    const markup = renderLoginDialog();
    const closeButton = markup.match(
      /<button\b(?=[^>]*aria-label="Close login dialog")[^>]*>/,
    )?.[0];

    expect(closeButton).toContain("size-11");
    expect(closeButton).toContain("focus-visible:outline");
  });

  it("resets the browser's default button border on the close control", () => {
    // The app does not load Tailwind's preflight, so a <button> without an
    // explicit border class renders the browser's 2px outset border as a ring.
    const markup = renderLoginDialog();
    const closeButton = markup.match(
      /<button\b(?=[^>]*aria-label="Close login dialog")[^>]*>/,
    )?.[0];

    expect(closeButton).toMatch(/class="[^"]*\bborder-0\b/);
  });

  it("keeps the optional method switch a keyboard-sized control", () => {
    const markup = renderLoginDialog({ emailCodeEnabled: true });
    const switchButton = markup.match(
      /<button\b(?=[^>]*>Use password<\/button>)[^>]*>/,
    )?.[0];

    expect(switchButton).toContain("min-h-11");
    expect(switchButton).toContain("focus-visible:outline");
  });
});
