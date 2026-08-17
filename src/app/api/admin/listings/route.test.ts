// Path: src/app/api/admin/listings/route.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/config", () => ({ auth: vi.fn() }));

vi.mock("@/lib/db", () => ({
  db: {
    hostel: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { GET } from "./route";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

function adminSession() {
  return { user: { id: "usr_admin_1", role: "ADMIN" } } as any;
}
function studentSession() {
  return { user: { id: "usr_student_1", role: "STUDENT" } } as any;
}

function req(query = "") {
  return new NextRequest(`https://hostello.test/api/admin/listings${query}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(db.hostel.findMany).mockResolvedValue([]);
  vi.mocked(db.hostel.count).mockResolvedValue(0);
});

describe("GET /api/admin/listings", () => {
  it("returns 403 for a non-admin session", async () => {
    vi.mocked(auth).mockResolvedValue(studentSession());

    const res = await GET(req("?status=PENDING_REVIEW"));

    expect(res.status).toBe(403);
    expect(db.hostel.findMany).not.toHaveBeenCalled();
  });

  it("returns 400 when status is missing", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());

    const res = await GET(req());

    expect(res.status).toBe(400);
  });

  it("returns 400 for a status value outside the known set", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());

    const res = await GET(req("?status=ARCHIVED"));

    expect(res.status).toBe(400);
  });

  it("filters by the given status and defaults page/limit to 1/20", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());

    await GET(req("?status=PENDING_REVIEW"));

    expect(db.hostel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "PENDING_REVIEW" },
        skip: 0,
        take: 20,
      }),
    );
  });

  it("respects explicit page and limit, computing skip correctly", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());

    await GET(req("?status=ACTIVE&page=3&limit=10"));

    expect(db.hostel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 }),
    );
  });

  it("clamps limit to a maximum of 50", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());

    await GET(req("?status=ACTIVE&limit=500"));

    expect(db.hostel.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 50 }));
  });

  it("computes hasMore correctly", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(db.hostel.findMany).mockResolvedValue(new Array(20).fill({ id: "h" }) as any);
    vi.mocked(db.hostel.count).mockResolvedValue(45);

    const res = await GET(req("?status=ACTIVE&page=1&limit=20"));
    const body = await res.json();

    expect(body.hasMore).toBe(true);
    expect(body.total).toBe(45);
  });

  it("hasMore is false on the last page", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession());
    vi.mocked(db.hostel.findMany).mockResolvedValue(new Array(5).fill({ id: "h" }) as any);
    vi.mocked(db.hostel.count).mockResolvedValue(45);

    const res = await GET(req("?status=ACTIVE&page=3&limit=20"));
    const body = await res.json();

    expect(body.hasMore).toBe(false);
  });
});
