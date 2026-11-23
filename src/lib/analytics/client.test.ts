import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getAnalyticsSessionId,
  resetAnalyticsClientForTests,
  track,
  trackOnce,
  trackingIsDisallowed,
} from "./client";

const fetchMock = vi.fn();
let storage: Record<string, string>;

function browser(options: { gpc?: boolean; dnt?: string | null; storageBlocked?: boolean } = {}) {
  storage = {};
  vi.stubGlobal("window", {
    sessionStorage: options.storageBlocked
      ? { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } }
      : { getItem: (key: string) => storage[key] ?? null, setItem: (key: string, value: string) => { storage[key] = value; } },
  });
  vi.stubGlobal("navigator", { globalPrivacyControl: options.gpc, doNotTrack: options.dnt ?? null });
}

beforeEach(() => {
  resetAnalyticsClientForTests();
  fetchMock.mockReset().mockResolvedValue({ ok: true });
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

const search = { city: "Lahore", nearby: false, hasDates: false, resultCount: 4 };

describe("track", () => {
  it("posts the event with this tab's session id, keeping the request alive across navigation", () => {
    browser();
    track("search_performed", search);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/events");
    expect(init).toMatchObject({ method: "POST", keepalive: true, headers: { "content-type": "application/json" } });
    expect(JSON.parse(init.body)).toEqual({ name: "search_performed", sessionId: expect.stringMatching(/^[0-9a-f-]{36}$/), properties: search });
  });

  it("uses one session id for the whole tab session and stores it only in sessionStorage", () => {
    browser();
    const first = getAnalyticsSessionId();
    expect(getAnalyticsSessionId()).toBe(first);
    expect(Object.keys(storage)).toEqual(["hostello.analytics.session"]);
  });

  it("falls back to an in-memory id when storage is blocked", () => {
    browser({ storageBlocked: true });
    const id = getAnalyticsSessionId();
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(getAnalyticsSessionId()).toBe(id);
  });

  it("sends nothing for visitors who sent Global Privacy Control or Do Not Track", () => {
    for (const options of [{ gpc: true }, { dnt: "1" }, { dnt: "yes" }]) {
      browser(options);
      expect(trackingIsDisallowed(), JSON.stringify(options)).toBe(true);
      track("search_performed", search);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("tracks visitors whose Do Not Track is explicitly off or unset", () => {
    browser({ dnt: "0" });
    expect(trackingIsDisallowed()).toBe(false);
    browser({ dnt: null });
    expect(trackingIsDisallowed()).toBe(false);
  });

  it("does nothing during server rendering", () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("navigator", undefined);
    expect(() => track("search_performed", search)).not.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never surfaces a failure to the visitor", async () => {
    browser();
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    expect(() => track("search_performed", search)).not.toThrow();

    fetchMock.mockImplementation(() => { throw new Error("fetch exploded"); });
    expect(() => track("search_performed", search)).not.toThrow();
    await Promise.resolve();
  });
});

describe("trackOnce", () => {
  it("sends the first call for an event and key, and ignores repeats", () => {
    browser();
    trackOnce("hostel_viewed", "h1", { hostelId: "chostel00000000000000001" });
    trackOnce("hostel_viewed", "h1", { hostelId: "chostel00000000000000001" });
    trackOnce("hostel_viewed", "h2", { hostelId: "chostel00000000000000002" });
    trackOnce("booking_started", "h1", { hostelId: "chostel00000000000000001" });

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("does not use up the first call when nothing was sent because tracking is disallowed", () => {
    browser({ gpc: true });
    trackOnce("hostel_viewed", "h1", { hostelId: "chostel00000000000000001" });
    expect(fetchMock).not.toHaveBeenCalled();

    browser(); // the same event later, for a visitor who is trackable
    trackOnce("hostel_viewed", "h1", { hostelId: "chostel00000000000000001" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
