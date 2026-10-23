import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/config", () => ({ auth: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn() }));

vi.mock("@/lib/db", () => ({
  db: {
    user: { count: vi.fn(), findMany: vi.fn() },
  },
}));

import { GET } from "./route";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth).mockResolvedValue({ user: { id: "admin_1", role: "ADMIN" } } as never);
  vi.mocked(rateLimit).mockResolvedValue({ ok: true, remaining: 9, resetAt: Date.now() + 60_000 });
  vi.mocked(db.user.count).mockResolvedValue(5);
  vi.mocked(db.user.findMany).mockResolvedValue([] as never);
});

describe("GET /api/admin/verifications/analytics", () => {
  it("rejects non-admin sessions before accessing verification data", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "student_1", role: "STUDENT" } } as never);

    const response = await GET(new NextRequest("https://hostello.test/api/admin/verifications/analytics"));

    expect(response.status).toBe(403);
    expect(db.user.count).not.toHaveBeenCalled();
    expect(db.user.findMany).not.toHaveBeenCalled();
  });

  it("paginates both analytics windows and preserves exact aggregates", async () => {
    const now = new Date();
    const decidedAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12));
    const submittedAt = new Date(decidedAt.getTime() - 4 * 60 * 60 * 1000);
    const submissionsFirstBatch = Array.from({ length: 200 }, (_, index) => ({
      id: `submitted_${String(index).padStart(3, "0")}`,
      verificationSubmittedAt: submittedAt,
    }));
    const decisionsFirstBatch = Array.from({ length: 200 }, (_, index) => ({
      id: `decided_${String(index).padStart(3, "0")}`,
      verificationStatus: "APPROVED",
      verificationSubmittedAt: submittedAt,
      verificationDecidedAt: decidedAt,
      verifiedById: "moderator_1",
    }));
    vi.mocked(db.user.findMany)
      .mockResolvedValueOnce(submissionsFirstBatch as never)
      .mockResolvedValueOnce([{
        id: "submitted_200",
        verificationSubmittedAt: submittedAt,
      }] as never)
      .mockResolvedValueOnce(decisionsFirstBatch as never)
      .mockResolvedValueOnce([{
        id: "decided_200",
        verificationStatus: "REJECTED",
        verificationSubmittedAt: submittedAt,
        verificationDecidedAt: decidedAt,
        verifiedById: "moderator_1",
      }] as never)
      .mockResolvedValueOnce([{ id: "moderator_1", name: "Mina" }] as never);

    const response = await GET(new NextRequest("https://hostello.test/api/admin/verifications/analytics?days=30"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.totalDecided).toBe(201);
    expect(body.data.approvalRate).toBeCloseTo((200 / 201) * 100);
    expect(body.data.avgProcessingHours).toBeCloseTo(4);
    expect(body.data.throughput).toEqual([
      { date: decidedAt.toISOString().slice(0, 10), submissions: 201, approvals: 200 },
    ]);
    expect(body.data.moderatorPerformance).toEqual([{
      id: "moderator_1",
      name: "Mina",
      totalReviews: 201,
      approvalRate: (200 / 201) * 100,
      avgHours: 4,
    }]);
    expect(db.user.findMany).toHaveBeenNthCalledWith(2, expect.objectContaining({
      where: { role: "STUDENT", verificationSubmittedAt: { gte: expect.any(Date) } },
      take: 200,
      cursor: { id: "submitted_199" },
      skip: 1,
    }));
    expect(db.user.findMany).toHaveBeenNthCalledWith(4, expect.objectContaining({
      where: { role: "STUDENT", verificationDecidedAt: { gte: expect.any(Date) } },
      take: 200,
      cursor: { id: "decided_199" },
      skip: 1,
    }));
  });

  it("throttles before scanning verification analytics", async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({ ok: false, remaining: 0, resetAt: Date.now() + 60_000 });

    const response = await GET(new NextRequest("https://hostello.test/api/admin/verifications/analytics"));

    expect(response.status).toBe(429);
    expect(Number(response.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(rateLimit).toHaveBeenCalledWith("admin-verification-analytics:admin_1", {
      limit: 10,
      windowMs: 60_000,
    });
    expect(db.user.count).not.toHaveBeenCalled();
    expect(db.user.findMany).not.toHaveBeenCalled();
  });
});
