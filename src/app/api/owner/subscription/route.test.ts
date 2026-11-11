import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  rateLimit: vi.fn(),
  userFindUnique: vi.fn(),
  subscriptionUpsert: vi.fn(),
  subscriptionUpdateMany: vi.fn(),
  subscriptionFindUnique: vi.fn(),
  createCheckoutSession: vi.fn(),
  createCheckoutLink: vi.fn(),
  subscriptionState: null as null | {
    id: string;
    userId: string;
    plan: string;
    status: string;
    paymentRef: string | null;
    renewalPaymentRef?: string | null;
    endDate?: Date | null;
  },
}));

vi.mock("@/lib/auth/config", () => ({ auth: mocks.auth }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: mocks.rateLimit }));
vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: mocks.userFindUnique },
    subscription: {
      upsert: mocks.subscriptionUpsert,
      updateMany: mocks.subscriptionUpdateMany,
      findUnique: mocks.subscriptionFindUnique,
    },
  },
}));
vi.mock("@/lib/safepay", () => ({
  createCheckoutSession: mocks.createCheckoutSession,
  createCheckoutLink: mocks.createCheckoutLink,
}));
vi.mock("@/lib/app-url", () => ({ getAppOrigin: () => "https://hostello.test" }));

import { POST } from "./route";

function request() {
  return new NextRequest("https://hostello.test/api/owner/subscription", { method: "POST" });
}

describe("POST /api/owner/subscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.subscriptionState = null;
    mocks.auth.mockResolvedValue({ user: { id: "owner-1", role: "OWNER" } });
    mocks.rateLimit.mockResolvedValue({ ok: true, remaining: 2, resetAt: Date.now() + 60_000 });
    mocks.userFindUnique.mockResolvedValue({
      plan: "FREE",
      name: "Owner",
      email: "owner@example.com",
      deletionRequestedAt: null,
    });
    mocks.subscriptionUpsert.mockImplementation(async ({ create, update }) => {
      if (mocks.subscriptionState) {
        mocks.subscriptionState = { ...mocks.subscriptionState, ...update };
      } else {
        mocks.subscriptionState = { ...create, paymentRef: null, id: "subscription-1" };
      }
      return mocks.subscriptionState;
    });
    mocks.subscriptionUpdateMany.mockImplementation(async ({ where, data }) => {
      const current = mocks.subscriptionState;
      if (current && Object.entries(where).every(([key, value]) => {
        const currentValue = current[key as keyof typeof current];
        if (key === "endDate" && value && typeof value === "object" && "lte" in value) {
          return currentValue instanceof Date && currentValue <= (value as { lte: Date }).lte;
        }
        return value instanceof Date
          ? currentValue instanceof Date && currentValue.getTime() === value.getTime()
          : currentValue === value;
      })) {
        mocks.subscriptionState = { ...current, ...data };
        return { count: 1 };
      }
      return { count: 0 };
    });
    mocks.subscriptionFindUnique.mockImplementation(async () => mocks.subscriptionState);
    mocks.createCheckoutSession.mockResolvedValue({
      token: "track-new",
      redirectUrl: "https://safepay.test/checkout?tracker=track-new",
    });
    mocks.createCheckoutLink.mockImplementation(async ({ token }) => ({
      token,
      redirectUrl: `https://safepay.test/embedded?tracker=${token}`,
    }));
  });

  it("reuses the stored tracker when retrying a pending checkout after a failed payment attempt", async () => {
    mocks.subscriptionState = {
      id: "subscription-1",
      userId: "owner-1",
      plan: "PRO",
      status: "PENDING",
      paymentRef: "track-after-failed-attempt",
    };

    const response = await POST(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.checkoutUrl).toContain("track-after-failed-attempt");
    expect(mocks.createCheckoutLink).toHaveBeenCalledWith(expect.objectContaining({
      bookingId: "subscription-1",
      orderId: "sub_subscription-1",
      token: "track-after-failed-attempt",
    }));
    expect(mocks.createCheckoutSession).not.toHaveBeenCalled();
    expect(mocks.subscriptionState.paymentRef).toBe("track-after-failed-attempt");
  });

  it("starts a fresh checkout after a cancelled subscription", async () => {
    mocks.subscriptionState = {
      id: "subscription-1",
      userId: "owner-1",
      plan: "PRO",
      status: "CANCELLED",
      paymentRef: "track-cancelled",
      renewalPaymentRef: null,
    };

    const response = await POST(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.checkoutUrl).toContain("track-new");
    expect(mocks.createCheckoutLink).not.toHaveBeenCalled();
    expect(mocks.createCheckoutSession).toHaveBeenCalledTimes(1);
    expect(mocks.subscriptionState).toMatchObject({
      status: "PENDING",
      paymentRef: "track-new",
    });
  });

  it("restarts an expired monthly subscription with a new tracker", async () => {
    mocks.subscriptionState = {
      id: "subscription-1",
      userId: "owner-1",
      plan: "PRO",
      status: "EXPIRED",
      paymentRef: "track-old-term",
      renewalPaymentRef: null,
    };

    const response = await POST(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.checkoutUrl).toContain("track-new");
    expect(mocks.subscriptionState).toMatchObject({ status: "PENDING", paymentRef: "track-new" });
    expect(mocks.createCheckoutSession).toHaveBeenCalledOnce();
  });

  it("keeps the active monthly term and persists a separate renewal tracker", async () => {
    const endDate = new Date("2099-06-01T00:00:00.000Z");
    mocks.subscriptionState = {
      id: "subscription-1",
      userId: "owner-1",
      plan: "PRO",
      status: "ACTIVE",
      paymentRef: "track-paid",
      renewalPaymentRef: null,
      endDate,
    };

    const response = await POST(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.checkoutUrl).toContain("track-new");
    expect(mocks.subscriptionState).toMatchObject({
      status: "ACTIVE",
      paymentRef: "track-paid",
      renewalPaymentRef: "track-new",
      endDate,
    });
    expect(mocks.subscriptionUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "subscription-1",
        status: "ACTIVE",
        endDate,
        renewalPaymentRef: null,
      },
      data: { renewalPaymentRef: "track-new" },
    });
  });

  it("does not reset an unknown or non-retryable subscription state", async () => {
    mocks.subscriptionState = {
      id: "subscription-1",
      userId: "owner-1",
      plan: "PRO",
      status: "REVIEW",
      paymentRef: "track-review",
    };

    const response = await POST(request());

    expect(response.status).toBe(409);
    expect(mocks.subscriptionState).toMatchObject({
      status: "REVIEW",
      paymentRef: "track-review",
    });
    expect(mocks.subscriptionUpdateMany).not.toHaveBeenCalled();
    expect(mocks.createCheckoutSession).not.toHaveBeenCalled();
  });

  it("makes concurrent checkout initiations converge on one usable tracker", async () => {
    mocks.createCheckoutSession
      .mockResolvedValueOnce({
        token: "track-first",
        redirectUrl: "https://safepay.test/checkout?tracker=track-first",
      })
      .mockResolvedValueOnce({
        token: "track-second",
        redirectUrl: "https://safepay.test/checkout?tracker=track-second",
      });

    const responses = await Promise.all([POST(request()), POST(request())]);
    const bodies = await Promise.all(responses.map((response) => response.json()));

    expect(responses.map((response) => response.status)).toEqual([200, 200]);
    const checkoutTrackers = bodies.map((body) => new URL(body.checkoutUrl).searchParams.get("tracker"));

    expect(new Set(checkoutTrackers).size).toBe(1);
    expect(mocks.subscriptionState?.paymentRef).toMatch(/^track-(first|second)$/);
    expect(checkoutTrackers[0]).toBe(mocks.subscriptionState?.paymentRef);
    expect(mocks.subscriptionUpdateMany).toHaveBeenCalledTimes(2);
  });
});
