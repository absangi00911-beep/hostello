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
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/config", () => ({ auth: vi.fn() }));

vi.mock("@/lib/db", () => ({
  db: { user: { findMany: vi.fn(), update: vi.fn() } },
}));

vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn().mockResolvedValue(undefined),
}));

import { GET, PUT } from "./route";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

function adminSession() {
  return { user: { id: "usr_admin_1", role: "ADMIN" } } as any;
}
function studentSession() {
  return { user: { id: "usr_student_1", role: "STUDENT" } } as any;
}

function getReq() {
  return new NextRequest("https://hostello.test/api/admin/verifications");
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

  it("returns pending verifications ordered oldest-submitted-first", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(db.user.findMany).mockResolvedValue([{ id: "usr_1", name: "Ali" }] as any);

    const res = await GET(getReq());
    const body = await res.json();

    expect(db.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { verificationStatus: "PENDING" },
        orderBy: { verificationSubmittedAt: "asc" },
      }),
    );
    expect(body.data).toHaveLength(1);
  });
});

describe("PUT /api/admin/verifications", () => {
  it("returns 403 for a non-admin session", async () => {
    vi.mocked(auth).mockResolvedValue(studentSession());

    const res = await PUT(putReq({ userId: "usr_1", action: "approve" }));

    expect(res.status).toBe(403);
    expect(db.user.update).not.toHaveBeenCalled();
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

  it("approve: sets APPROVED + studentVerified true, notifies with HOSTEL_APPROVED (reused type)", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(db.user.update).mockResolvedValue({} as any);

    const res = await PUT(putReq({ userId: "usr_1", action: "approve" }));
    await new Promise((r) => setTimeout(r, 0));

    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "usr_1" },
      data: { verificationStatus: "APPROVED", studentVerified: true, verificationDocUrl: undefined },
    });
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "usr_1", type: "HOSTEL_APPROVED" }),
    );
    expect(res.status).toBe(200);
  });

  it("reject: sets REJECTED + studentVerified false, clears the doc URL, notifies with HOSTEL_REJECTED", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(db.user.update).mockResolvedValue({} as any);

    await PUT(putReq({ userId: "usr_1", action: "reject" }));
    await new Promise((r) => setTimeout(r, 0));

    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "usr_1" },
      data: { verificationStatus: "REJECTED", studentVerified: false, verificationDocUrl: null },
    });
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: "HOSTEL_REJECTED" }),
    );
  });

  it("doesn't fail the request if the notification dispatch rejects", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(db.user.update).mockResolvedValue({} as any);
    vi.mocked(createNotification).mockRejectedValueOnce(new Error("down"));

    const res = await PUT(putReq({ userId: "usr_1", action: "approve" }));

    expect(res.status).toBe(200);
  });
});
