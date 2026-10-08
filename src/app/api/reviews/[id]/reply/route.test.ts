import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  rateLimit: vi.fn(),
  reviewFindFirst: vi.fn(),
  reviewUpdateMany: vi.fn(),
}));

vi.mock("@/lib/auth/config", () => ({ auth: mocks.auth }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: mocks.rateLimit }));
vi.mock("@/lib/db", () => ({
  db: { review: { findFirst: mocks.reviewFindFirst, updateMany: mocks.reviewUpdateMany } },
}));

import { DELETE, PATCH } from "@/app/api/reviews/[id]/reply/route";

const OWNER_SESSION = {
  user: { id: "owner-1", role: "OWNER" },
};
const REVIEW = {
  id: "review-1",
  hostel: { ownerId: OWNER_SESSION.user.id },
};
const PARAMS = { params: Promise.resolve({ id: REVIEW.id }) };

function makeRequest() {
  return new NextRequest("https://hostello.test/api/reviews/review-1/reply", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ownerReply: "Thank you for sharing this review." }),
  });
}

describe("review-reply ownership boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue(OWNER_SESSION);
    mocks.rateLimit.mockResolvedValue({ ok: true, remaining: 9, resetAt: Date.now() + 60 * 60 * 1000 });
    mocks.reviewFindFirst.mockResolvedValue({ id: REVIEW.id });
    mocks.reviewUpdateMany.mockResolvedValue({ count: 1 });
  });

  it("rejects roles without reply privileges before reading a review", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "student-1", role: "STUDENT" } });

    const response = await PATCH(makeRequest(), PARAMS);

    expect(response.status).toBe(403);
    expect(mocks.rateLimit).not.toHaveBeenCalled();
    expect(mocks.reviewFindFirst).not.toHaveBeenCalled();
  });

  it("throttles reply changes before reading the review", async () => {
    mocks.rateLimit.mockResolvedValue({ ok: false, remaining: 0, resetAt: Date.now() + 60 * 60 * 1000 });

    const response = await PATCH(makeRequest(), PARAMS);

    expect(response.status).toBe(429);
    expect(mocks.rateLimit).toHaveBeenCalledWith("review-reply:owner-1", {
      limit: 10,
      windowMs: 60 * 60 * 1000,
    });
    expect(mocks.reviewFindFirst).not.toHaveBeenCalled();
  });

  it("scopes reply preflight to the current owner and hides foreign review IDs", async () => {
    mocks.reviewFindFirst.mockResolvedValue(null);

    const response = await PATCH(makeRequest(), PARAMS);

    expect(response.status).toBe(404);
    expect(mocks.reviewFindFirst).toHaveBeenCalledWith({
      where: { id: REVIEW.id, hostel: { is: { ownerId: OWNER_SESSION.user.id } } },
      select: { id: true },
    });
    expect(mocks.reviewUpdateMany).not.toHaveBeenCalled();
  });

  it("includes current hostel ownership in the reply write predicate", async () => {
    const response = await PATCH(makeRequest(), PARAMS);

    expect(response.status).toBe(200);
    expect(mocks.reviewUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        id: REVIEW.id,
        hostel: { is: { ownerId: OWNER_SESSION.user.id } },
      },
      data: {
        ownerReply: "Thank you for sharing this review.",
        repliedAt: expect.any(Date),
      },
    }));
  });

  it("returns a conflict if ownership changes between authorization and write", async () => {
    mocks.reviewUpdateMany.mockResolvedValue({ count: 0 });

    const response = await PATCH(makeRequest(), PARAMS);

    expect(response.status).toBe(409);
  });

  it("hides foreign review IDs when removing a reply", async () => {
    mocks.reviewFindFirst.mockResolvedValue(null);

    const response = await DELETE(
      new NextRequest("https://hostello.test/api/reviews/review-1/reply", { method: "DELETE" }),
      PARAMS,
    );

    expect(response.status).toBe(404);
    expect(mocks.reviewFindFirst).toHaveBeenCalledWith({
      where: { id: REVIEW.id, hostel: { is: { ownerId: OWNER_SESSION.user.id } } },
      select: { id: true },
    });
    expect(mocks.reviewUpdateMany).not.toHaveBeenCalled();
  });

  it("applies the same conditional ownership check when removing a reply", async () => {
    const response = await DELETE(
      new NextRequest("https://hostello.test/api/reviews/review-1/reply", { method: "DELETE" }),
      PARAMS,
    );

    expect(response.status).toBe(200);
    expect(mocks.rateLimit).toHaveBeenCalledWith("review-reply:owner-1", {
      limit: 10,
      windowMs: 60 * 60 * 1000,
    });
    expect(mocks.reviewUpdateMany).toHaveBeenCalledWith({
      where: {
        id: REVIEW.id,
        hostel: { is: { ownerId: OWNER_SESSION.user.id } },
      },
      data: { ownerReply: null, repliedAt: null },
    });
  });
});
