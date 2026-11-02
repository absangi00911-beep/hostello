import { describe, expect, it } from "vitest";
import {
  errorCodeLabel,
  formatEventAmount,
  parseAdminPaymentEventsPage,
  retryBlockedReason,
  validateRetryReason,
  validateTracker,
  type AdminPaymentEvent,
} from "./adminPaymentEvents";

const apiEvent = (overrides: Record<string, unknown> = {}) => ({
  id: "e1",
  eventType: "payment.succeeded",
  merchantOrderId: "order_1",
  tracker: "track_1",
  providerState: "PAID",
  amountMinorUnits: 2500000,
  currency: "PKR",
  status: "RETRYABLE",
  processingAttempts: 2,
  lastErrorCode: "qstash_delivery_exhausted",
  receivedAt: "2026-11-01T10:00:00.000Z",
  updatedAt: "2026-11-01T10:05:00.000Z",
  replayEvents: [],
  ...overrides,
});

const page = (data: unknown[], extra: Record<string, unknown> = {}) => ({
  data,
  total: data.length,
  page: 1,
  limit: 25,
  ...extra,
});

const event = (overrides: Partial<AdminPaymentEvent> = {}): AdminPaymentEvent => ({
  id: "e1",
  eventType: "payment.succeeded",
  merchantOrderId: "order_1",
  tracker: "track_1",
  providerState: null,
  amountMinorUnits: null,
  currency: null,
  status: "RETRYABLE",
  processingAttempts: 1,
  lastErrorCode: null,
  receivedAt: "2026-11-01T10:00:00.000Z",
  updatedAt: "2026-11-01T10:00:00.000Z",
  replays: [],
  ...overrides,
});

describe("parseAdminPaymentEventsPage", () => {
  it("parses events and renames replayEvents", () => {
    const parsed = parseAdminPaymentEventsPage(
      page([
        apiEvent({
          replayEvents: [
            {
              adminUserId: "a1",
              providerTracker: "track_1",
              reason: "Checked in Safepay, payment is settled.",
              createdAt: "2026-11-01T11:00:00.000Z",
            },
          ],
        }),
      ]),
    );
    expect(parsed?.data[0]).toMatchObject({ id: "e1", status: "RETRYABLE" });
    expect(parsed?.data[0].replays).toHaveLength(1);
    expect(parsed?.hasMore).toBe(false);
  });

  it("accepts null optional fields", () => {
    const parsed = parseAdminPaymentEventsPage(
      page([
        apiEvent({
          merchantOrderId: null,
          tracker: null,
          providerState: null,
          amountMinorUnits: null,
          currency: null,
          lastErrorCode: null,
        }),
      ]),
    );
    expect(parsed?.data[0].tracker).toBeNull();
  });

  it("derives hasMore from page size and total", () => {
    const parsed = parseAdminPaymentEventsPage(
      page([apiEvent()], { total: 40, limit: 25 }),
    );
    expect(parsed?.hasMore).toBe(true);
    const last = parseAdminPaymentEventsPage(
      page([apiEvent()], { total: 26, page: 2, limit: 25 }),
    );
    expect(last?.hasMore).toBe(false);
  });

  it("rejects unexpected shapes", () => {
    expect(parseAdminPaymentEventsPage(null)).toBeNull();
    expect(parseAdminPaymentEventsPage({ data: [] })).toBeNull();
    expect(
      parseAdminPaymentEventsPage(page([apiEvent({ status: "PROCESSED" })])),
    ).toBeNull();
    expect(
      parseAdminPaymentEventsPage(page([apiEvent({ receivedAt: "nope" })])),
    ).toBeNull();
  });
});

describe("retryBlockedReason", () => {
  it("allows a retryable event with a tracker", () => {
    expect(retryBlockedReason(event())).toBeNull();
  });

  it("blocks reconciliation, missing tracker and invalid evidence", () => {
    expect(
      retryBlockedReason(event({ status: "RECONCILIATION_REQUIRED" })),
    ).toContain("manual reconciliation");
    expect(retryBlockedReason(event({ tracker: null }))).toContain("no Safepay tracker");
    expect(
      retryBlockedReason(event({ lastErrorCode: "invalid_stored_event" })),
    ).toContain("invalid");
  });
});

describe("validation", () => {
  it("requires the exact stored tracker", () => {
    expect(validateTracker("", "track_1")).toContain("Enter");
    expect(validateTracker("track_2", "track_1")).toContain("exactly match");
    expect(validateTracker(" track_1 ", "track_1")).toBeNull();
    expect(validateTracker("x".repeat(257), "track_1")).toContain("256");
  });

  it("requires a reason of 20 to 500 characters", () => {
    expect(validateRetryReason("too short")).toContain("20");
    expect(validateRetryReason("a".repeat(20))).toBeNull();
    expect(validateRetryReason("a".repeat(501))).toContain("500");
  });
});

describe("display helpers", () => {
  it("formats minor units as major currency", () => {
    expect(formatEventAmount(2500000, "PKR")).toContain("25,000");
    expect(formatEventAmount(null, "PKR")).toBeNull();
  });

  it("explains known error codes and falls back for others", () => {
    expect(errorCodeLabel("qstash_delivery_exhausted")).toContain("queue");
    expect(errorCodeLabel("something_else")).toBe("Processing stopped with an error.");
  });
});
