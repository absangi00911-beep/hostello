// Path: src/app/api/admin/verifications/route.test.ts
//
// Note: the PUT handler sends student-verification notifications using the
// HOSTEL_APPROVED / HOSTEL_REJECTED notification types (the code comment
// itself says "reuse closest type"), the same types admin/hostels/route.ts
// uses for hostel-listing approval/suspension — but without a hostelId. If
// any notification-bell UI ever assumes HOSTEL_APPROVED always carries a
// hostelId, a verification notification would break that assumption. Tests
// below cover current behavior as-is.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

vi.mock("@/lib/auth/config", () => ({ auth: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn() }));
vi.mock("@/lib/admin-read-limit", () => ({ enforceAdminReadLimit: vi.fn() }));

vi.mock("@/lib/db", () => ({
  db: { user: { findMany: vi.fn(), findUnique: vi.fn(), count: vi.fn(), update: vi.fn(), updateMany: vi.fn() } },
}));

vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn().mockResolvedValue(undefined),
}));

import { GET, PUT } from "./route";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { rateLimit } from "@/lib/rate-limit";
import { enforceAdminReadLimit } from "@/lib/admin-read-limit";

function adminSession() {
  return { user: { id: "usr_admin_1", role: "ADMIN" } } as any;
}
function studentSession() {
  return { user: { id: "usr_student_1", role: "STUDENT" } } as any;
}

function getReq(query = "") {
  return new NextRequest(`https://hostello.test/api/admin/verifications${query}`);
}

function putReq(body: unknown) {
  return new NextRequest("https://hostello.test/api/admin/verifications", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(enforceAdminReadLimit).mockResolvedValue(null);
  vi.mocked(rateLimit).mockResolvedValue({ ok: true, remaining: 29, resetAt: Date.now() + 60_000 });
  vi.mocked(db.user.findUnique).mockResolvedValue(null as any);
  vi.mocked(db.user.updateMany).mockResolvedValue({ count: 1 } as any);
});

describe("GET /api/admin/verifications", () => {
  it("returns 403 for a non-admin session", async () => {
    vi.mocked(auth).mockResolvedValue(studentSession());

    const res = await GET(getReq());

    expect(res.status).toBe(403);
  });

  it("returns 403 with no session at all", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const res = await GET(getReq());

    expect(res.status).toBe(403);
  });

  it("enforces the shared admin read quota before fetching student records", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(enforceAdminReadLimit).mockResolvedValueOnce(NextResponse.json(
      { error: "Too many admin requests. Please slow down." },
      { status: 429, headers: { "Retry-After": "30" } },
    ));

    const response = await GET(getReq());

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("30");
    expect(enforceAdminReadLimit).toHaveBeenCalledWith("usr_admin_1");
    expect(db.user.findMany).not.toHaveBeenCalled();
    expect(db.user.count).not.toHaveBeenCalled();
  });

  it("returns pending verifications ordered oldest-submitted-first", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(db.user.findMany).mockResolvedValue([{ id: "usr_1", name: "Ali" }] as any);
    vi.mocked(db.user.count).mockResolvedValue(1 as any);

    const res = await GET(getReq());
    const body = await res.json();

    expect(db.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { role: "STUDENT", verificationStatus: "PENDING" },
        orderBy: { verificationSubmittedAt: "asc" },
        skip: 0,
        take: 25,
      }),
    );
    expect(body.data).toHaveLength(1);
    expect(body.total).toBe(1);
    expect(body.hasMore).toBe(false);
  });

  it("bounds pages and applies the search on the server", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(db.user.findMany).mockResolvedValue(Array.from({ length: 50 }, (_, index) => ({
      id: `usr_${index}`,
      name: "Ali",
      email: "ali@example.com",
      city: null,
      verificationDocUrl: null,
      verificationSubmittedAt: new Date(),
      _count: { bookings: 0 },
    })) as any);
    vi.mocked(db.user.count).mockResolvedValue(180 as any);

    const res = await GET(getReq("?status=APPROVED&page=3&limit=100&search=Ali"));
    const body = await res.json();

    expect(db.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        role: "STUDENT",
        verificationStatus: "APPROVED",
        OR: [
          { name: { contains: "Ali", mode: "insensitive" } },
          { email: { contains: "Ali", mode: "insensitive" } },
        ],
      },
      skip: 100,
      take: 50,
    }));
    expect(db.user.count).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ verificationStatus: "APPROVED" }),
    }));
    expect(body).toMatchObject({ total: 180, page: 3, limit: 50, hasMore: true });
  });

  it("returns an admin-only document endpoint without exposing the private storage key", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(db.user.count).mockResolvedValue(1 as any);
    const storageKey = `student-verifications/usr_1/${"a".repeat(32)}.jpg`;
    vi.mocked(db.user.findMany).mockResolvedValue([{
      id: "usr_1",
      name: "Ali",
      email: "ali@example.com",
      city: null,
      verificationDocUrl: storageKey,
      verificationSubmittedAt: new Date(),
      _count: { bookings: 0 },
    }] as any);

    const response = await GET(getReq());
    const serialized = JSON.stringify(await response.json());

    expect(serialized).toContain("/api/admin/verifications/usr_1/document");
    expect(serialized).not.toContain(storageKey);
  });
});

describe("PUT /api/admin/verifications", () => {
  it("returns 403 for a non-admin session", async () => {
    vi.mocked(auth).mockResolvedValue(studentSession());

    const res = await PUT(putReq({ userId: "usr_1", action: "approve" }));

    expect(res.status).toBe(403);
    expect(db.user.updateMany).not.toHaveBeenCalled();
  });

  it("limits verification decisions per admin before parsing or updating", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(rateLimit).mockResolvedValue({ ok: false, remaining: 0, resetAt: Date.now() + 30_000 });

    const response = await PUT(new NextRequest("https://hostello.test/api/admin/verifications", {
      method: "PUT",
      body: "not-json",
    }));

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
    expect(db.user.updateMany).not.toHaveBeenCalled();
  });

  it("returns 400 when userId is missing", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());

    const res = await PUT(putReq({ action: "approve" }));

    expect(res.status).toBe(400);
  });

  it("returns 400 for an action outside approve/reject", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());

    const res = await PUT(putReq({ userId: "usr_1", action: "delete" }));

    expect(res.status).toBe(400);
  });

  it("approve: sets APPROVED + studentVerified true, notifies with STUDENT_VERIFICATION_APPROVED", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    const res = await PUT(putReq({ userId: "usr_1", action: "approve" }));
    await new Promise((r) => setTimeout(r, 0));

    expect(db.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "usr_1", role: "STUDENT", verificationStatus: "PENDING" },
        data: expect.objectContaining({
          verificationStatus: "APPROVED",
          studentVerified: true,
          verificationDocUrl: null,
          verifiedById: "usr_admin_1",
          verificationDecidedAt: expect.any(Date),
        }),
      }),
    );
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "usr_1", type: "STUDENT_VERIFICATION_APPROVED" }),
    );
    expect(res.status).toBe(200);
  });

  it("reject: sets REJECTED + studentVerified false, clears the doc URL, notifies with STUDENT_VERIFICATION_REJECTED", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    await PUT(putReq({ userId: "usr_1", action: "reject" }));
    await new Promise((r) => setTimeout(r, 0));

    expect(db.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "usr_1", role: "STUDENT", verificationStatus: "PENDING" },
        data: expect.objectContaining({
          verificationStatus: "REJECTED",
          studentVerified: false,
          verificationDocUrl: null,
          verifiedById: "usr_admin_1",
          verificationDecidedAt: expect.any(Date),
        }),
      }),
    );
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: "STUDENT_VERIFICATION_REJECTED" }),
    );
  });

  it("doesn't fail the request if the notification dispatch rejects", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(createNotification).mockRejectedValueOnce(new Error("down"));

    const res = await PUT(putReq({ userId: "usr_1", action: "approve" }));

    expect(res.status).toBe(200);
  });

  it("doesn't overwrite or notify a request that is no longer pending", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(db.user.updateMany).mockResolvedValue({ count: 0 } as any);

    const res = await PUT(putReq({ userId: "usr_1", action: "approve" }));

    expect(res.status).toBe(409);
    expect(createNotification).not.toHaveBeenCalled();
  });
});
