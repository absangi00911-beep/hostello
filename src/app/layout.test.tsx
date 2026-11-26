import { beforeEach, describe, expect, it, vi } from "vitest";

const connection = vi.hoisted(() => vi.fn(async () => undefined));
vi.mock("next/server", () => ({ connection }));
vi.mock("next/font/google", () => ({ Inter: () => ({ variable: "font-inter" }) }));
vi.mock("@/components/layout/SiteFooter", () => ({ SiteFooter: () => null }));
vi.mock("@/components/auth/LoginDialogProvider", () => ({
  LoginDialogProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/lib/auth/sign-in-methods", () => ({
  getConfiguredSignInMethods: () => ({ emailCode: true, google: false }),
}));
vi.mock("./globals.css", () => ({}));

import RootLayout from "./layout";

beforeEach(() => {
  connection.mockClear();
  vi.unstubAllEnvs();
});

describe("RootLayout and the nonce policy", () => {
  it("leaves pages free to be prerendered while the policy is only reported", async () => {
    await RootLayout({ children: null });
    expect(connection).not.toHaveBeenCalled();
  });

  it("uses a flex column body so short pages can keep the footer at the bottom", async () => {
    const html = (await RootLayout({ children: null })) as {
      props: { children: React.ReactElement<{ className: string }> };
    };
    const body = html.props.children;

    expect(body.props.className.split(" ")).toEqual(
      expect.arrayContaining(["flex", "flex-col", "min-h-dvh"]),
    );
  });

  it("forces per-request rendering once the nonce policy is enforced", async () => {
    vi.stubEnv("CSP_ENFORCE", "true");
    await RootLayout({ children: null });
    expect(connection).toHaveBeenCalledTimes(1);
  });

  it("puts the skip link first, before any other focusable content", async () => {
    const html = (await RootLayout({ children: null })) as { props: { children: { props: { children: unknown } } } };
    const bodyChildren = [html.props.children].flat().flatMap((node) => (node as { props: { children: unknown } }).props.children);
    const first = [bodyChildren].flat()[0] as { type: { name: string } };

    expect(first.type.name).toBe("SkipLink");
  });
});
