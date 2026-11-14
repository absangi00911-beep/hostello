import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ rateLimit: vi.fn(), log: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: mocks.rateLimit, getIp: () => "203.0.113.5" }));
vi.mock("@/lib/operational-logger", () => ({ logOperationalEvent: mocks.log }));

import { POST } from "./route";

const post = (body: string, headers: Record<string, string> = {}) =>
  POST(new Request("https://hostello.example/api/csp-report", { method: "POST", body, headers }));

const report = JSON.stringify({
  "csp-report": {
    "document-uri": "https://hostello.example/login?next=/owner",
    "violated-directive": "script-src-elem",
    "blocked-uri": "https://evil.test/x.js?secret=1",
  },
});

beforeEach(() => {
  mocks.rateLimit.mockReset().mockResolvedValue({ ok: true, remaining: 19, resetAt: 0 });
  mocks.log.mockReset();
});

describe("POST /api/csp-report", () => {
  it("logs a sanitized violation and answers 204", async () => {
    const response = await post(report, { "content-type": "application/csp-report" });

    expect(response.status).toBe(204);
    expect(mocks.log).toHaveBeenCalledWith("warn", "csp.violation", {
      directive: "script-src-elem",
      blocked: "https://evil.test",
      document: "/login",
      disposition: "report",
    });
    expect(JSON.stringify(mocks.log.mock.calls)).not.toContain("secret=1");
  });

  it("rate limits per client IP without failing closed", async () => {
    await post(report);
    expect(mocks.rateLimit).toHaveBeenCalledWith("csp-report:203.0.113.5", { limit: 20, windowMs: 60_000 });
    expect(mocks.rateLimit.mock.calls[0][1]).not.toHaveProperty("failClosed");
  });

  it("drops reports over the limit silently", async () => {
    mocks.rateLimit.mockResolvedValue({ ok: false, remaining: 0, resetAt: 1 });
    expect((await post(report)).status).toBe(204);
    expect(mocks.log).not.toHaveBeenCalled();
  });

  it("drops oversized bodies, declared or actual, and malformed JSON", async () => {
    expect((await post(report, { "content-length": "999999" })).status).toBe(204);
    expect((await post("x".repeat(20_000))).status).toBe(204);
    expect((await post("{not json")).status).toBe(204);
    expect(mocks.log).not.toHaveBeenCalled();
  });
});
