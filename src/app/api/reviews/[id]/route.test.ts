import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  reviewFindUnique: vi.fn(),
  reviewDelete: vi.fn(),
  reviewAggregate: vi.fn(),
  hostelUpdate: vi.fn(),
  indexSingleHostel: vi.fn(),
  rateLimit: vi.fn(),
}));

vi.mock("@/lib/auth/config", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({
  db: {
    review: {
      findUnique: mocks.reviewFindUnique,
      delete: mocks.reviewDelete,
      aggregate: mocks.reviewAggregate,
    },
    hostel: { update: mocks.hostelUpdate },
    $transaction: vi.fn(async (work: (tx: unknown) => Promise<unknown>) => work({
      review: {
        findUnique: mocks.reviewFindUnique,
        delete: mocks.reviewDelete,
        aggregate: mocks.reviewAggregate,
      },
      hostel: { update: mocks.hostelUpdate },
    })),
  },
}));
vi.mock("@/lib/typesense-sync", () => ({ indexSingleHostel: mocks.indexSingleHostel }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: mocks.rateLimit }));

import { DELETE } from "@/app/api/reviews/[id]/route";

const REVIEW_ID = "review-1";
const HOSTEL_ID = "hostel-1";

function makeRequest() {
  return new NextRequest(`https://hostello.pk/api/reviews/${REVIEW_ID}`, { method: "DELETE" });
}

describe("DELETE /api/reviews/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
    mocks.reviewFindUnique.mockResolvedValue({ id: REVIEW_ID, hostelId: HOSTEL_ID });
    mocks.reviewDelete.mockResolvedValue({ id: REVIEW_ID });
    mocks.reviewAggregate.mockResolvedValue({ _avg: { rating: 4.5 }, _count: { rating: 4 } });
    mocks.hostelUpdate.mockResolvedValue({ id: HOSTEL_ID });
    mocks.indexSingleHostel.mockResolvedValue(undefined);
    mocks.rateLimit.mockResolvedValue({ ok: true, remaining: 29, resetAt: Date.now() + 60_000 });
  });

  it("requires an administrator", async () => {
    mocks.auth.mockResolvedValueOnce(null);
    const unauthenticated = await DELETE(makeRequest(), { params: Promise.resolve({ id: REVIEW_ID }) });
    expect(unauthenticated.status).toBe(401);

    mocks.auth.mockResolvedValueOnce({ user: { id: "owner-1", role: "OWNER" } });
    const owner = await DELETE(makeRequest(), { params: Promise.resolve({ id: REVIEW_ID }) });
    expect(owner.status).toBe(403);
    expect(mocks.reviewFindUnique).not.toHaveBeenCalled();
  });

  it("limits review moderation before reading or deleting the review", async () => {
    mocks.rateLimit.mockResolvedValue({ ok: false, remaining: 0, resetAt: Date.now() + 30_000 });

    const response = await DELETE(makeRequest(), { params: Promise.resolve({ id: REVIEW_ID }) });

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
    expect(mocks.reviewFindUnique).not.toHaveBeenCalled();
  });

  it("deletes the review, refreshes hostel aggregates, and reindexes search", async () => {
    const response = await DELETE(makeRequest(), { params: Promise.resolve({ id: REVIEW_ID }) });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: "Review deleted." });
    expect(mocks.reviewDelete).toHaveBeenCalledWith({ where: { id: REVIEW_ID } });
    expect(mocks.reviewAggregate).toHaveBeenCalledWith(expect.objectContaining({ where: { hostelId: HOSTEL_ID } }));
    expect(mocks.hostelUpdate).toHaveBeenCalledWith({
      where: { id: HOSTEL_ID },
      data: { rating: 4.5, reviewCount: 4 },
    });
    expect(mocks.indexSingleHostel).toHaveBeenCalledWith(HOSTEL_ID);
  });

  it("returns 404 without changing aggregates when the review is missing", async () => {
    mocks.reviewFindUnique.mockResolvedValue(null);

    const response = await DELETE(makeRequest(), { params: Promise.resolve({ id: REVIEW_ID }) });

    expect(response.status).toBe(404);
    expect(mocks.reviewDelete).not.toHaveBeenCalled();
    expect(mocks.reviewAggregate).not.toHaveBeenCalled();
    expect(mocks.hostelUpdate).not.toHaveBeenCalled();
    expect(mocks.indexSingleHostel).not.toHaveBeenCalled();
  });
});
