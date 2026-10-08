import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn() }));

import { enforceAdminReadLimit } from "./admin-read-limit";
import { rateLimit } from "@/lib/rate-limit";

describe("enforceAdminReadLimit", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses a shared 60-per-minute bucket keyed only by admin", async () => {
    vi.mocked(rateLimit).mockResolvedValue({ ok: true, remaining: 59, resetAt: Date.now() + 60_000 });

    await expect(enforceAdminReadLimit("usr_admin_1")).resolves.toBeNull();

    expect(rateLimit).toHaveBeenCalledWith("admin-read:usr_admin_1", {
      limit: 60,
      windowMs: 60_000,
    });
  });

  it("returns Retry-After when the shared admin budget is exhausted", async () => {
    vi.mocked(rateLimit).mockResolvedValue({ ok: false, remaining: 0, resetAt: Date.now() + 30_000 });

    const response = await enforceAdminReadLimit("usr_admin_1");

    expect(response?.status).toBe(429);
    expect(response?.headers.get("Retry-After")).toBe("30");
    expect(await response?.json()).toEqual({ error: "Too many admin requests. Please slow down." });
  });
});
