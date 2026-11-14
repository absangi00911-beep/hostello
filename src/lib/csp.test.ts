import { describe, expect, it } from "vitest";
import {
  buildContentSecurityPolicy,
  generateNonce,
  getEnforcedScriptSrc,
  getNonceScriptSrc,
  getR2CspSource,
} from "@/lib/csp";

const directive = (policy: string, name: string) =>
  policy.split("; ").find((part) => part.startsWith(`${name} `)) ?? "";

describe("getR2CspSource", () => {
  it("allows only the configured https bucket origin", () => {
    expect(getR2CspSource("https://pub-abc.r2.dev")).toBe("https://pub-abc.r2.dev");
    expect(getR2CspSource("https://img.example.com:8443/path")).toBe("https://img.example.com:8443");
  });

  it("falls back to the wildcard for development and Preview", () => {
    for (const value of [undefined, "", "http://insecure.example", "not a url"]) {
      expect(getR2CspSource(value)).toBe("https://*.r2.dev");
    }
  });
});

describe("buildContentSecurityPolicy", () => {
  const r2Source = "https://pub-abc.r2.dev";

  it("keeps the enforced policy permissive for scripts, strict everywhere else", () => {
    const policy = buildContentSecurityPolicy({ scriptSrc: getEnforcedScriptSrc(false), r2Source });
    expect(directive(policy, "script-src")).toBe("script-src 'self' 'unsafe-inline'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("base-uri 'self'");
    expect(policy).toContain(`https://pub-abc.r2.dev`);
    expect(policy).not.toContain("report-uri");
  });

  it("adds unsafe-eval only in development", () => {
    expect(getEnforcedScriptSrc(true)).toContain("'unsafe-eval'");
    expect(getEnforcedScriptSrc(false)).not.toContain("'unsafe-eval'");
    expect(getNonceScriptSrc("abc", true)).toContain("'unsafe-eval'");
    expect(getNonceScriptSrc("abc", false)).not.toContain("'unsafe-eval'");
  });

  it("builds a nonce policy without unsafe-inline for scripts, reporting to the given URI", () => {
    const policy = buildContentSecurityPolicy({
      scriptSrc: getNonceScriptSrc("bm9uY2U=", false),
      r2Source,
      reportUri: "/api/csp-report",
    });
    const scriptSrc = directive(policy, "script-src");

    expect(scriptSrc).toBe("script-src 'self' 'nonce-bm9uY2U=' 'strict-dynamic'");
    expect(scriptSrc).not.toContain("unsafe-inline");
    expect(policy.endsWith("report-uri /api/csp-report")).toBe(true);
  });
});

describe("generateNonce", () => {
  it("is base64, long enough to be unguessable, and different every time", () => {
    const nonces = new Set(Array.from({ length: 50 }, generateNonce));
    expect(nonces.size).toBe(50);
    for (const nonce of nonces) {
      expect(nonce).toMatch(/^[A-Za-z0-9+/]+=*$/);
      expect(nonce.length).toBeGreaterThanOrEqual(32);
    }
  });
});
