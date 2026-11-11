import { beforeEach, describe, expect, it, vi } from "vitest";

const userFindUnique = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db", () => ({ db: { user: { findUnique: userFindUnique }, hostel: { count: vi.fn() } } }));

import { getOwnerPlan } from "./subscription";

beforeEach(() => vi.clearAllMocks());

describe("getOwnerPlan defensive entitlement", () => {
  it("returns FREE past the seven-day grace even when the stored user plan is still PRO", async () => {
    userFindUnique.mockResolvedValue({
      plan: "PRO",
      subscription: { status: "ACTIVE", endDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },
    });
    await expect(getOwnerPlan("owner-1")).resolves.toBe("FREE");
  });

  it("keeps Pro during the seven-day grace window", async () => {
    userFindUnique.mockResolvedValue({
      plan: "PRO",
      subscription: { status: "ACTIVE", endDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) },
    });
    await expect(getOwnerPlan("owner-1")).resolves.toBe("PRO");
  });

  it("does not grant Pro from a stale plan without an active dated subscription", async () => {
    userFindUnique.mockResolvedValue({ plan: "PRO", subscription: { status: "PENDING", endDate: null } });
    await expect(getOwnerPlan("owner-1")).resolves.toBe("FREE");
  });
});
