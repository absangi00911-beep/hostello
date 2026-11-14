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

  it("forces per-request rendering once the nonce policy is enforced", async () => {
    vi.stubEnv("CSP_ENFORCE", "true");
    await RootLayout({ children: null });
    expect(connection).toHaveBeenCalledTimes(1);
  });
});
