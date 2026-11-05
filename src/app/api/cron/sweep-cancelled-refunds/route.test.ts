import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/refund-sweeper", () => ({ sweepCancelledRefunds: vi.fn() }));
vi.mock("@/lib/verify-upstash", () => ({ verifyUpstashRequest: vi.fn() }));
vi.mock("@/lib/cron-utils", () => ({
  runCronJob: vi.fn(async (_name: string, handler: () => Promise<unknown>) =>
    Response.json(await handler()),
  ),
}));

import { POST } from "./route";
import { sweepCancelledRefunds } from "@/lib/refund-sweeper";
import { verifyUpstashRequest } from "@/lib/verify-upstash";

function request() {
  return new NextRequest("https://hostello.test/api/cron/sweep-cancelled-refunds", {
    method: "POST",
  });
}

describe("POST /api/cron/sweep-cancelled-refunds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyUpstashRequest).mockResolvedValue(true);
    vi.mocked(sweepCancelledRefunds).mockResolvedValue({
      scanned: 3,
      attempted: 2,
      refunded: 1,
      unconfirmed: 1,
      skipped: 1,
    });
  });

  it("requires QStash authorization before sweeping", async () => {
    vi.mocked(verifyUpstashRequest).mockRejectedValueOnce(new Error("bad signature"));

    const response = await POST(request());

    expect(response.status).toBe(401);
    expect(sweepCancelledRefunds).not.toHaveBeenCalled();
  });

  it("runs the bounded cancelled-refund sweep through cron health plumbing", async () => {
    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      message: "Cancelled refunds swept",
      attempted: 2,
      refunded: 1,
      unconfirmed: 1,
    });
    expect(sweepCancelledRefunds).toHaveBeenCalledOnce();
  });
});
