import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

vi.mock("@/lib/verify-upstash", () => ({ verifyUpstashRequest: vi.fn() }));
vi.mock("@/lib/verification-storage", () => ({ deleteExpiredVerificationUploads: vi.fn() }));
vi.mock("@/lib/cron-utils", () => ({
  runCronJob: vi.fn(async (
    _name: string,
    handler: (context: unknown) => Promise<unknown>,
    context: unknown,
  ) => NextResponse.json(await handler(context))),
}));

import { POST } from "./route";
import { runCronJob } from "@/lib/cron-utils";
import { verifyUpstashRequest } from "@/lib/verify-upstash";
import { deleteExpiredVerificationUploads } from "@/lib/verification-storage";

function request() {
  return new NextRequest("https://hostello.test/api/cron/cleanup-verification-uploads", { method: "POST" });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(verifyUpstashRequest).mockResolvedValue(true as any);
  vi.mocked(deleteExpiredVerificationUploads).mockResolvedValue(2);
});

describe("POST /api/cron/cleanup-verification-uploads", () => {
  it("rejects calls without valid QStash or cron-secret auth", async () => {
    vi.mocked(verifyUpstashRequest).mockRejectedValueOnce(new Error("unauthorized"));

    const response = await POST(request());

    expect(response.status).toBe(401);
    expect(runCronJob).not.toHaveBeenCalled();
  });

  it("runs the bounded abandoned-upload cleanup through cron tracking", async () => {
    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: "Expired private verification uploads cleaned up", count: 2 });
    expect(runCronJob).toHaveBeenCalledWith(
      "cleanup-verification-uploads",
      expect.any(Function),
      expect.objectContaining({ request_id: expect.any(String) }),
    );
    expect(deleteExpiredVerificationUploads).toHaveBeenCalledOnce();
  });
});
