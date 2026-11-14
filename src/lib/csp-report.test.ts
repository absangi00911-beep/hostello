import { describe, expect, it } from "vitest";
import { parseCspReports, summarizeBlockedUri, summarizeDocument } from "@/lib/csp-report";

describe("summarizeBlockedUri", () => {
  it("keeps only the origin of a blocked URL", () => {
    expect(summarizeBlockedUri("https://cdn.example/a/b.js?token=secret#frag")).toBe("https://cdn.example");
  });

  it("passes CSP keywords through and reduces other schemes to the scheme", () => {
    expect(summarizeBlockedUri("inline")).toBe("inline");
    expect(summarizeBlockedUri("eval")).toBe("eval");
    expect(summarizeBlockedUri("data:text/javascript,alert(1)")).toBe("data");
    expect(summarizeBlockedUri(undefined)).toBe("");
  });
});

describe("summarizeDocument", () => {
  it("keeps the path only, never the query string", () => {
    expect(summarizeDocument("https://hostello.example/reset-password?token=abc123")).toBe("/reset-password");
    expect(summarizeDocument("not a url")).toBe("");
  });
});

describe("parseCspReports", () => {
  it("reads the legacy report-uri format", () => {
    const [summary] = parseCspReports({
      "csp-report": {
        "document-uri": "https://hostello.example/hostels/x?email=a@b.c",
        "violated-directive": "script-src-elem",
        "effective-directive": "script-src-elem",
        "blocked-uri": "inline",
        disposition: "report",
      },
    });
    expect(summary).toEqual({
      directive: "script-src-elem",
      blocked: "inline",
      document: "/hostels/x",
      disposition: "report",
    });
  });

  it("reads the Reporting API format, several reports at once", () => {
    const summaries = parseCspReports([
      { type: "csp-violation", body: { effectiveDirective: "img-src", blockedURL: "https://x.test/p.png?a=1", documentURL: "https://hostello.example/", disposition: "report" } },
      { type: "deprecation", body: { id: "ignored" } },
      { type: "csp-violation", body: { effectiveDirective: "connect-src", blockedURL: "https://y.test/api" } },
    ]);
    expect(summaries.map((s) => [s.directive, s.blocked])).toEqual([
      ["img-src", "https://x.test"],
      ["connect-src", "https://y.test"],
    ]);
  });

  it("ignores junk and caps how many reports it accepts", () => {
    expect(parseCspReports("nope")).toEqual([]);
    expect(parseCspReports(null)).toEqual([]);
    expect(parseCspReports({ "csp-report": {} })).toEqual([]);
    const many = Array.from({ length: 50 }, () => ({ "csp-report": { "violated-directive": "img-src" } }));
    expect(parseCspReports(many)).toHaveLength(5);
  });

  it("bounds the length of every reported field", () => {
    const [summary] = parseCspReports({ "csp-report": { "violated-directive": "x".repeat(5000) } });
    expect(summary.directive).toHaveLength(120);
  });
});
