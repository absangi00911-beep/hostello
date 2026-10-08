import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

vi.mock("@/lib/db", () => ({
  db: {
    passwordResetToken: { deleteMany: vi.fn() },
    verificationToken: { deleteMany: vi.fn() },
  },
}));
vi.mock("@/lib/verify-upstash", () => ({ verifyUpstashRequest: vi.fn() }));
vi.mock("@/lib/operational-logger", () => ({
  createOperationalLogContext: vi.fn(() => ({ request_id: "req_test" })),
}));
vi.mock("@/lib/cron-utils", () => ({
  runCronJob: vi.fn(async (
    _name: string,
    handler: (context: unknown) => Promise<unknown>,
    context: unknown,
  ) => NextResponse.json(await handler(context))),
}));

import { POST } from "./route";
import { db } from "@/lib/db";
import { runCronJob } from "@/lib/cron-utils";
import { verifyUpstashRequest } from "@/lib/verify-upstash";

function request() {
  return new NextRequest("https://hostello.test/api/cron/cleanup-tokens", { method: "POST" });
}

describe("POST /api/cron/cleanup-tokens", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyUpstashRequest).mockResolvedValue(true);
    vi.mocked(db.passwordResetToken.deleteMany).mockResolvedValue({ count: 2 });
    vi.mocked(db.verificationToken.deleteMany).mockResolvedValue({ count: 3 });
  });

  it("returns unauthorized when QStash verification throws and skips cleanup", async () => {
    vi.mocked(verifyUpstashRequest).mockRejectedValueOnce(new Error("bad signature"));

    const response = await POST(request());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
    expect(runCronJob).not.toHaveBeenCalled();
    expect(db.passwordResetToken.deleteMany).not.toHaveBeenCalled();
    expect(db.verificationToken.deleteMany).not.toHaveBeenCalled();
  });

  it("runs cleanup only after request verification succeeds", async () => {
    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      message: "Tokens cleaned up",
      count: 5,
      resetTokens: 2,
      verifTokens: 3,
    });
    expect(runCronJob).toHaveBeenCalledWith(
      "cleanup-tokens",
      expect.any(Function),
      expect.objectContaining({ request_id: "req_test" }),
    );
    expect(db.passwordResetToken.deleteMany).toHaveBeenCalledOnce();
    expect(db.verificationToken.deleteMany).toHaveBeenCalledOnce();
  });
});
