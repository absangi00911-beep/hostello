import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/availability-alerts", () => ({
  expireAvailabilityAlerts: vi.fn(),
}));
vi.mock("@/lib/verify-upstash", () => ({
  verifyUpstashRequest: vi.fn(),
}));
vi.mock("@/lib/cron-utils", () => ({
  runCronJob: vi.fn(async (_name: string, handler: () => Promise<unknown>) =>
    Response.json(await handler()),
  ),
}));

import { POST } from "./route";
import { expireAvailabilityAlerts } from "@/lib/availability-alerts";
import { verifyUpstashRequest } from "@/lib/verify-upstash";

const request = () => new NextRequest(
  "https://hostello.test/api/cron/expire-availability-alerts",
  { method: "POST" },
);

describe("POST /api/cron/expire-availability-alerts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyUpstashRequest).mockResolvedValue(true);
    vi.mocked(expireAvailabilityAlerts).mockResolvedValue({ count: 3 } as never);
  });

  it("expires alerts without evaluating or notifying them", async () => {
    const response = await POST(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      message: "Expired date-bound availability alerts",
      count: 3,
    });
    expect(expireAvailabilityAlerts).toHaveBeenCalledOnce();
  });

  it("requires a signed cron request", async () => {
    vi.mocked(verifyUpstashRequest).mockRejectedValueOnce(new Error("invalid"));

    const response = await POST(request());

    expect(response.status).toBe(401);
    expect(expireAvailabilityAlerts).not.toHaveBeenCalled();
  });
});
