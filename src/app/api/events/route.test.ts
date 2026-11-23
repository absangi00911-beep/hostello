import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ record: vi.fn(), rateLimit: vi.fn() }));
vi.mock("@/lib/analytics/sink", () => ({ recordAnalyticsEvent: mocks.record }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: mocks.rateLimit, getIp: () => "203.0.113.9" }));

import { POST } from "./route";

const SESSION = "3f2b8c1e-9a4d-4c6e-8b7a-1d2e3f4a5b6c";
const HOSTEL = "chostel00000000000000001";

const post = (body: unknown, headers: Record<string, string> = {}) =>
  POST(
    new Request("https://hostello.test/api/events", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
const event = (name: string, properties: unknown, sessionId = SESSION) => ({ name, sessionId, properties });

beforeEach(() => {
  mocks.record.mockReset().mockResolvedValue(undefined);
  mocks.rateLimit.mockReset().mockResolvedValue({ ok: true, remaining: 100, resetAt: 0 });
});

describe("POST /api/events: recording", () => {
  it("records a search with its session, keeping the details as properties", async () => {
    const response = await post(event("search_performed", { city: "Lahore", nearby: false, hasDates: true, resultCount: 7 }));

    expect(response.status).toBe(204);
    expect(mocks.record).toHaveBeenCalledWith({
      name: "search_performed",
      sessionId: SESSION,
      hostelId: null,
      bookingId: null,
      properties: { city: "Lahore", nearby: false, hasDates: true, resultCount: 7 },
    });
  });

  it("moves the hostel id into its own column, leaving no empty properties", async () => {
    await post(event("hostel_viewed", { hostelId: HOSTEL }));
    expect(mocks.record).toHaveBeenCalledWith({
      name: "hostel_viewed",
      sessionId: SESSION,
      hostelId: HOSTEL,
      bookingId: null,
      properties: null,
    });
  });

  it("records booking_started with its room as a property", async () => {
    await post(event("booking_started", { hostelId: HOSTEL, roomId: "croom0000000000000000001" }));
    expect(mocks.record.mock.calls[0][0]).toMatchObject({ hostelId: HOSTEL, properties: { roomId: "croom0000000000000000001" } });
  });

  it("rate limits by IP without failing closed", async () => {
    await post(event("hostel_viewed", { hostelId: HOSTEL }));
    expect(mocks.rateLimit).toHaveBeenCalledWith("events:203.0.113.9", { limit: 120, windowMs: 60_000 });
    expect(mocks.rateLimit.mock.calls[0][1]).not.toHaveProperty("failClosed");
  });
});

describe("POST /api/events: what it ignores", () => {
  const valid = event("hostel_viewed", { hostelId: HOSTEL });

  it("drops events from visitors who opted out, whatever their client sent", async () => {
    for (const headers of [{ "sec-gpc": "1" }, { dnt: "1" }]) {
      expect((await post(valid, headers)).status).toBe(204);
    }
    expect(mocks.record).not.toHaveBeenCalled();
  });

  it("drops crawlers and monitors", async () => {
    for (const ua of ["Googlebot/2.1", "Mozilla/5.0 (compatible; bingbot/2.0)", "Slackbot-LinkExpanding", "UptimeRobot monitor"]) {
      expect((await post(valid, { "user-agent": ua })).status).toBe(204);
    }
    expect(mocks.record).not.toHaveBeenCalled();
  });

  it("does not mistake a headless test browser for a crawler", async () => {
    await post(valid, { "user-agent": "Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/153.0 Safari/537.36" });
    expect(mocks.record).toHaveBeenCalledTimes(1);
  });

  it("drops events over the rate limit, quietly", async () => {
    mocks.rateLimit.mockResolvedValue({ ok: false, remaining: 0, resetAt: 1 });
    expect((await post(valid)).status).toBe(204);
    expect(mocks.record).not.toHaveBeenCalled();
  });
});

describe("POST /api/events: what it rejects", () => {
  it("rejects names a browser may not send, including the server-only money steps", async () => {
    for (const name of ["payment_confirmed", "booking_requested", "payment_started", "__proto__", "toString", "unknown", ""]) {
      const response = await post(event(name, {}));
      expect(response.status, name).toBe(400);
    }
    expect(mocks.record).not.toHaveBeenCalled();
  });

  it("rejects extra properties, wrong types and bad session ids", async () => {
    const bad = [
      event("hostel_viewed", { hostelId: HOSTEL, email: "a@b.c" }),
      event("hostel_viewed", { hostelId: 42 }),
      event("search_performed", { nearby: "no", hasDates: false, resultCount: 1 }),
      event("hostel_viewed", { hostelId: HOSTEL }, "not a valid session id with spaces!!"),
      event("hostel_viewed", { hostelId: HOSTEL }, ""),
      { name: "hostel_viewed", properties: { hostelId: HOSTEL } },
    ];
    for (const body of bad) expect((await post(body)).status, JSON.stringify(body).slice(0, 60)).toBe(400);
    expect(mocks.record).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON and non-object bodies", async () => {
    for (const body of ["{not json", "[]", "null", '"text"', ""]) expect((await post(body)).status, body).toBe(400);
  });

  it("rejects oversized bodies, declared or actual", async () => {
    expect((await post(event("hostel_viewed", { hostelId: HOSTEL }), { "content-length": "999999" })).status).toBe(413);
    expect((await post(event("search_performed", { city: "x".repeat(3000), nearby: false, hasDates: false, resultCount: 1 }))).status).toBe(413);
    expect(mocks.record).not.toHaveBeenCalled();
  });
});
