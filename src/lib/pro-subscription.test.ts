import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  subscriptionFindUnique: vi.fn(),
  subscriptionFindMany: vi.fn(),
  subscriptionUpdateMany: vi.fn(),
  userUpdateMany: vi.fn(),
  transaction: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  db: {
    subscription: {
      findUnique: mocks.subscriptionFindUnique,
      findMany: mocks.subscriptionFindMany,
      updateMany: mocks.subscriptionUpdateMany,
    },
    user: { updateMany: mocks.userUpdateMany },
    $transaction: mocks.transaction,
  },
}));

import {
  expireProSubscriptionForUser,
  expireProSubscriptions,
  getProGraceEndDate,
  getProTermEndDate,
  isProEntitled,
  PRO_SUBSCRIPTION_GRACE_DAYS,
  PRO_SUBSCRIPTION_TERM_MONTHS,
} from "./pro-subscription";

const now = new Date("2030-03-10T12:00:00.000Z");
const tx = {
  subscription: { updateMany: mocks.subscriptionUpdateMany },
  user: { updateMany: mocks.userUpdateMany },
};

describe("Pro subscription launch defaults", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (work: (client: typeof tx) => Promise<unknown>) => work(tx));
    mocks.subscriptionUpdateMany.mockResolvedValue({ count: 1 });
    mocks.userUpdateMany.mockResolvedValue({ count: 1 });
  });

  it("uses one clamped calendar-month term and a seven-day grace window", () => {
    expect(PRO_SUBSCRIPTION_TERM_MONTHS).toBe(1);
    expect(PRO_SUBSCRIPTION_GRACE_DAYS).toBe(7);
    const termEnd = getProTermEndDate(new Date("2030-01-31T12:00:00.000Z"));
    expect(termEnd.toISOString()).toBe("2030-02-28T12:00:00.000Z");
    expect(getProGraceEndDate(termEnd).toISOString()).toBe("2030-03-07T12:00:00.000Z");
  });

  it("grants entitlement only through the inclusive end of the grace window", () => {
    const endDate = new Date("2030-03-01T12:00:00.000Z");
    expect(isProEntitled("ACTIVE", endDate, new Date("2030-03-08T11:59:59.999Z"))).toBe(true);
    expect(isProEntitled("ACTIVE", endDate, new Date("2030-03-08T12:00:00.000Z"))).toBe(false);
    expect(isProEntitled("PENDING", endDate, now)).toBe(false);
    expect(isProEntitled("ACTIVE", null, now)).toBe(false);
  });

  it("expires only after the term plus grace and atomically downgrades the owner", async () => {
    const endDate = new Date(now.getTime() - PRO_SUBSCRIPTION_GRACE_DAYS * 24 * 60 * 60 * 1000);
    mocks.subscriptionFindUnique.mockResolvedValue({
      id: "subscription-1", userId: "owner-1", status: "ACTIVE", endDate, renewalPaymentRef: null,
    });

    await expect(expireProSubscriptionForUser("owner-1", now)).resolves.toBe(true);

    expect(mocks.subscriptionUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "subscription-1",
        status: "ACTIVE",
        endDate: { lte: endDate },
        renewalPaymentRef: null,
      },
      data: { status: "EXPIRED" },
    });
    expect(mocks.userUpdateMany).toHaveBeenCalledWith({
      where: { id: "owner-1", plan: "PRO" },
      data: { plan: "FREE" },
    });
  });

  it("does not expire an active subscription inside the grace period", async () => {
    mocks.subscriptionFindUnique.mockResolvedValue({
      id: "subscription-1", userId: "owner-1", status: "ACTIVE",
      endDate: new Date(now.getTime() - (PRO_SUBSCRIPTION_GRACE_DAYS - 1) * 24 * 60 * 60 * 1000),
    });

    await expect(expireProSubscriptionForUser("owner-1", now)).resolves.toBe(false);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("keeps an issued renewal reference reconcilable after entitlement grace ends", async () => {
    const endDate = new Date(now.getTime() - PRO_SUBSCRIPTION_GRACE_DAYS * 24 * 60 * 60 * 1000);
    mocks.subscriptionFindMany.mockResolvedValue([
      { id: "subscription-1", userId: "owner-1", endDate, renewalPaymentRef: "track-renewal" },
    ]);

    await expect(expireProSubscriptions(now)).resolves.toBe(1);
    expect(mocks.subscriptionUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "subscription-1",
        status: "ACTIVE",
        endDate: { lte: endDate },
        renewalPaymentRef: "track-renewal",
      },
      data: { status: "ACTIVE" },
    });
    expect(mocks.userUpdateMany).toHaveBeenCalledWith({
      where: { id: "owner-1", plan: "PRO" },
      data: { plan: "FREE" },
    });
  });

  it("uses compare-and-set state so retrying the expiry sweep is harmless", async () => {
    const endDate = new Date(now.getTime() - PRO_SUBSCRIPTION_GRACE_DAYS * 24 * 60 * 60 * 1000);
    mocks.subscriptionFindMany.mockResolvedValue([
      { id: "subscription-1", userId: "owner-1", endDate, renewalPaymentRef: null },
    ]);
    mocks.subscriptionUpdateMany.mockResolvedValue({ count: 0 });

    await expect(expireProSubscriptions(now)).resolves.toBe(0);
    expect(mocks.userUpdateMany).not.toHaveBeenCalled();
  });
});
