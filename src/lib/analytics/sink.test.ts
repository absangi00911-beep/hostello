import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ create: vi.fn(), log: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { analyticsEvent: { create: mocks.create } } }));
vi.mock("@/lib/operational-logger", () => ({ logOperationalEvent: mocks.log }));

import {
  databaseSink,
  recordAnalyticsEvent,
  recordServerEvent,
  setAnalyticsSink,
  type AnalyticsRecord,
} from "./sink";

const record = (overrides: Partial<AnalyticsRecord> = {}): AnalyticsRecord => ({
  name: "hostel_viewed",
  sessionId: "3f2b8c1e-9a4d-4c6e-8b7a-1d2e3f4a5b6c",
  hostelId: "chostel00000000000000001",
  bookingId: null,
  properties: null,
  ...overrides,
});

beforeEach(() => {
  mocks.create.mockReset().mockResolvedValue({});
  mocks.log.mockReset();
  setAnalyticsSink(databaseSink);
});

describe("database sink", () => {
  it("stores the event, and leaves properties out when there are none", async () => {
    await recordAnalyticsEvent(record());
    expect(mocks.create).toHaveBeenCalledWith({
      data: { name: "hostel_viewed", sessionId: "3f2b8c1e-9a4d-4c6e-8b7a-1d2e3f4a5b6c", hostelId: "chostel00000000000000001", bookingId: null },
    });
  });

  it("stores properties when present", async () => {
    await recordAnalyticsEvent(record({ name: "search_performed", properties: { city: "Lahore", resultCount: 3 } }));
    expect(mocks.create.mock.calls[0][0].data.properties).toEqual({ city: "Lahore", resultCount: 3 });
  });

  it("never stores anything that identifies a person", async () => {
    await recordAnalyticsEvent(record());
    expect(Object.keys(mocks.create.mock.calls[0][0].data).sort()).toEqual(["bookingId", "hostelId", "name", "sessionId"]);
  });
});

describe("recordAnalyticsEvent", () => {
  it("never throws when storing fails, and logs only a safe summary", async () => {
    mocks.create.mockRejectedValue(Object.assign(new Error("postgres://user:secret@db down"), { code: "ECONNRESET" }));

    await expect(recordAnalyticsEvent(record())).resolves.toBeUndefined();

    expect(mocks.log).toHaveBeenCalledWith("warn", "analytics.record_failed", {
      event_name: "hostel_viewed",
      error_name: "Error",
      error_code: "ECONNRESET",
    });
    expect(JSON.stringify(mocks.log.mock.calls)).not.toContain("secret");
  });

  it("sends events to whichever sink is selected, so the provider can be swapped", async () => {
    const other = { record: vi.fn().mockResolvedValue(undefined) };
    const previous = setAnalyticsSink(other);

    await recordAnalyticsEvent(record());

    expect(previous).toBe(databaseSink);
    expect(other.record).toHaveBeenCalledTimes(1);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("survives a sink that throws synchronously", async () => {
    setAnalyticsSink({ record: () => { throw new Error("boom"); } });
    await expect(recordAnalyticsEvent(record())).resolves.toBeUndefined();
  });
});

describe("recordServerEvent", () => {
  it("ties the event to its booking, with no session", async () => {
    await recordServerEvent("payment_confirmed", { bookingId: "cbooking000000000000001", hostelId: "chostel00000000000000001" });
    expect(mocks.create).toHaveBeenCalledWith({
      data: { name: "payment_confirmed", sessionId: null, hostelId: "chostel00000000000000001", bookingId: "cbooking000000000000001" },
    });
  });

  it("allows a missing hostel", async () => {
    await recordServerEvent("payment_started", { bookingId: "cbooking000000000000001" });
    expect(mocks.create.mock.calls[0][0].data.hostelId).toBeNull();
  });
});
