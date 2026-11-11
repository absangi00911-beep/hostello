import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ verify: vi.fn(), run: vi.fn(), drain: vi.fn() }));
vi.mock("@/lib/verify-upstash", () => ({ verifyUpstashRequest: mocks.verify }));
vi.mock("@/lib/cron-utils", () => ({ runCronJob: mocks.run }));
vi.mock("@/lib/operational-logger", () => ({ createOperationalLogContext: vi.fn(() => ({})) }));
vi.mock("@/lib/payment-email-outbox", () => ({ drainPaymentEmailOutbox: mocks.drain }));

import { POST } from "./route";

function request() {
  return new NextRequest("https://hostello.test/api/cron/drain-payment-email-outbox", { method: "POST" });
}

describe("POST /api/cron/drain-payment-email-outbox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verify.mockResolvedValue(true);
    mocks.run.mockImplementation(async (_name: string, handler: () => Promise<unknown>) => Response.json(await handler()));
    mocks.drain.mockResolvedValue({ scanned: 2, sent: 1, retried: 1, dead: 0, skipped: 0, deleted: 1 });
  });

  it("rejects unauthorized calls before touching outbox rows", async () => {
    mocks.verify.mockRejectedValueOnce(new Error("invalid signature"));
    const response = await POST(request());
    expect(response.status).toBe(401);
    expect(mocks.drain).not.toHaveBeenCalled();
  });

  it("runs the bounded outbox worker through cron health plumbing", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ message: "Payment email outbox drained", sent: 1, retried: 1 });
    expect(mocks.run).toHaveBeenCalledWith("drain-payment-email-outbox", expect.any(Function), {});
  });
});
