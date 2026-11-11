import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  verify: vi.fn(),
  run: vi.fn(),
  expire: vi.fn(),
}));
vi.mock("@/lib/verify-upstash", () => ({ verifyUpstashRequest: mocks.verify }));
vi.mock("@/lib/cron-utils", () => ({ runCronJob: mocks.run }));
vi.mock("@/lib/operational-logger", () => ({ createOperationalLogContext: vi.fn(() => ({})) }));
vi.mock("@/lib/pro-subscription", () => ({ expireProSubscriptions: mocks.expire }));

import { POST } from "./route";

function request() {
  return new NextRequest("https://hostello.test/api/cron/expire-pro-subscriptions", { method: "POST" });
}

describe("POST /api/cron/expire-pro-subscriptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verify.mockResolvedValue(true);
    mocks.run.mockImplementation(async (_name: string, handler: () => Promise<unknown>) => Response.json(await handler()));
    mocks.expire.mockResolvedValue(2);
  });

  it("rejects unsigned calls before running the expiry sweep", async () => {
    mocks.verify.mockRejectedValueOnce(new Error("invalid signature"));
    const response = await POST(request());
    expect(response.status).toBe(401);
    expect(mocks.expire).not.toHaveBeenCalled();
  });

  it("runs the idempotent expiry sweep through the shared cron wrapper", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(mocks.run).toHaveBeenCalledWith("expire-pro-subscriptions", expect.any(Function), {});
    expect(await response.json()).toMatchObject({ count: 2 });
  });
});
