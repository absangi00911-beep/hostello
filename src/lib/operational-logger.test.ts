import { describe, expect, it, vi } from "vitest";
import {
  createOperationalLogContext,
  hashOperationalIdentifier,
  logOperationalEvent,
} from "./operational-logger";

describe("operational log correlation", () => {
  it("uses a valid platform request ID and W3C trace ID", () => {
    const request = new Request("https://hostello.test/api", {
      headers: {
        "x-vercel-id": "iad1::abc-123",
        traceparent: "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
      },
    });

    expect(createOperationalLogContext(request)).toEqual({
      request_id: "iad1::abc-123",
      trace_id: "4bf92f3577b34da6a3ce929d0e0e4736",
    });
  });

  it("does not trust malformed platform IDs or invalid trace context", () => {
    const request = new Request("https://hostello.test/api", {
      headers: {
        "x-vercel-id": "request;forged",
        traceparent: "00-00000000000000000000000000000000-00f067aa0ba902b7-01",
      },
    });

    const context = createOperationalLogContext(request);
    expect(context.request_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(context).not.toHaveProperty("trace_id");
  });

  it("emits stable JSON event fields and keeps event attributes explicit", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const context = { request_id: "req-1", trace_id: "a".repeat(32) };

    logOperationalEvent("info", "booking.payment_confirmed", { booking_id: "booking-1" }, context);

    const [line] = info.mock.calls[0];
    expect(JSON.parse(String(line))).toMatchObject({
      severity: "INFO",
      event: "booking.payment_confirmed",
      service_name: "hostello",
      request_id: "req-1",
      trace_id: "a".repeat(32),
      attributes: { booking_id: "booking-1" },
    });
    info.mockRestore();
  });

  it("hashes audit identifiers with the application secret and omits them without one", () => {
    vi.stubEnv("AUTH_SECRET", "test-audit-secret");
    vi.stubEnv("NEXTAUTH_SECRET", "fallback-secret");
    const first = hashOperationalIdentifier("booking:booking-1");

    expect(first).toMatch(/^[0-9a-f]{24}$/);
    expect(first).toBe(hashOperationalIdentifier("booking:booking-1"));
    expect(first).not.toContain("booking-1");

    vi.stubEnv("AUTH_SECRET", "");
    vi.stubEnv("NEXTAUTH_SECRET", "");
    expect(hashOperationalIdentifier("booking:booking-1")).toBeNull();
    vi.unstubAllEnvs();
  });
});
