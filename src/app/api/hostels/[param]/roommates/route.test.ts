// Path: src/app/api/hostels/[param]/roommates/route.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    hostel: {
      findFirst: vi.fn(),
    },
    roommatePost: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import { GET, POST } from "./route";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

function studentSession() {
  return { user: { id: "usr_student_1" } } as any;
}

function ctx(param: string) {
  return { params: Promise.resolve({ param }) };
}

function getReq() {
  return new NextRequest("https://hostello.test/api/hostels/green-view/roommates");
}

function postReq(body: unknown) {
  return new NextRequest("https://hostello.test/api/hostels/green-view/roommates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeHostel(overrides = {}) {
  return { id: "hst_1", name: "Green View", ownerId: "usr_owner_1", ...overrides };
}

function makePost(overrides = {}) {
  return {
    id: "rmp_1",
    bio: "Looking for a quiet roommate",
    budget: 15000,
    moveIn: null,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    createdAt: new Date(),
    userId: "usr_student_1",
    user: { id: "usr_student_1", name: "Ali", avatar: null, city: "Lahore" },
    _count: { reports: 0 },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/hostels/[param]/roommates", () => {
  it("returns 404 when the hostel doesn't exist or isn't active", async () => {
    vi.mocked(db.hostel.findFirst).mockResolvedValue(null);

    const res = await GET(getReq(), ctx("nonexistent"));

    expect(res.status).toBe(404);
  });

  it("resolves the hostel by id or slug", async () => {
    vi.mocked(db.hostel.findFirst).mockResolvedValue(makeHostel() as any);
    vi.mocked(db.roommatePost.findMany).mockResolvedValue([]);

    await GET(getReq(), ctx("green-view"));

    expect(db.hostel.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ OR: [{ id: "green-view" }, { slug: "green-view" }] }),
      }),
    );
  });

  it("returns posts with zero reports", async () => {
    vi.mocked(db.hostel.findFirst).mockResolvedValue(makeHostel() as any);
    vi.mocked(db.roommatePost.findMany).mockResolvedValue([makePost()] as any);

    const res = await GET(getReq(), ctx("green-view"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
  });

  it(
    "hides a post after its very first report, not after reaching AUTO_HIDE_REPORTS (3) — " +
      "documents current behavior, not necessarily intended behavior; see the finding note in the session summary",
    async () => {
      vi.mocked(db.hostel.findFirst).mockResolvedValue(makeHostel() as any);
      // The route's own DB query filters to `reports: { none: {} }` — zero reports only —
      // before the in-memory `_count.reports < 3` check ever runs. That in-memory check
      // can therefore never reject anything: every row already has _count.reports === 0
      // by construction. A post with 1 or 2 reports never reaches findMany's result set
      // at all, so it's indistinguishable here from a post with 3+.
      vi.mocked(db.roommatePost.findMany).mockResolvedValue([]);

      const res = await GET(getReq(), ctx("green-view"));
      const body = await res.json();

      expect(db.roommatePost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ reports: { none: {} } }),
        }),
      );
      expect(body.data).toHaveLength(0);
    },
  );

  it("excludes a post that slips through with reports already attached (belt-and-suspenders in-memory filter)", async () => {
    vi.mocked(db.hostel.findFirst).mockResolvedValue(makeHostel() as any);
    vi.mocked(db.roommatePost.findMany).mockResolvedValue([
      makePost({ id: "clean", _count: { reports: 0 } }),
      makePost({ id: "reported", _count: { reports: 5 } }),
    ] as any);

    const res = await GET(getReq(), ctx("green-view"));
    const body = await res.json();

    expect(body.data.map((p: any) => p.id)).toEqual(["clean"]);
  });
});

describe("POST /api/hostels/[param]/roommates", () => {
  it("returns 401 with no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const res = await POST(postReq({ bio: "hi" }), ctx("green-view"));

    expect(res.status).toBe(401);
  });

  it("returns 404 for a hostel that doesn't exist", async () => {
    vi.mocked(auth).mockResolvedValue(studentSession());
    vi.mocked(db.hostel.findFirst).mockResolvedValue(null);

    const res = await POST(postReq({ bio: "hi" }), ctx("nonexistent"));

    expect(res.status).toBe(404);
  });

  it("returns 400 when bio is missing or blank", async () => {
    vi.mocked(auth).mockResolvedValue(studentSession());
    vi.mocked(db.hostel.findFirst).mockResolvedValue(makeHostel() as any);

    const res = await POST(postReq({ bio: "   " }), ctx("green-view"));

    expect(res.status).toBe(400);
    expect(db.roommatePost.upsert).not.toHaveBeenCalled();
  });

  it("truncates bio to 200 characters", async () => {
    vi.mocked(auth).mockResolvedValue(studentSession());
    vi.mocked(db.hostel.findFirst).mockResolvedValue(makeHostel() as any);
    vi.mocked(db.roommatePost.upsert).mockResolvedValue(makePost() as any);

    const longBio = "x".repeat(250);
    await POST(postReq({ bio: longBio }), ctx("green-view"));

    const call = vi.mocked(db.roommatePost.upsert).mock.calls[0][0] as any;
    expect(call.create.bio).toHaveLength(200);
  });

  it("treats a non-positive budget as null rather than rejecting the request", async () => {
    vi.mocked(auth).mockResolvedValue(studentSession());
    vi.mocked(db.hostel.findFirst).mockResolvedValue(makeHostel() as any);
    vi.mocked(db.roommatePost.upsert).mockResolvedValue(makePost() as any);

    await POST(postReq({ bio: "hi", budget: -500 }), ctx("green-view"));

    const call = vi.mocked(db.roommatePost.upsert).mock.calls[0][0] as any;
    expect(call.create.budget).toBeNull();
  });

  it("upserts on the hostelId+userId compound key, refreshing the 30-day expiry on update", async () => {
    vi.mocked(auth).mockResolvedValue(studentSession());
    vi.mocked(db.hostel.findFirst).mockResolvedValue(makeHostel() as any);
    vi.mocked(db.roommatePost.upsert).mockResolvedValue(makePost() as any);

    const res = await POST(postReq({ bio: "Looking for someone quiet", budget: 15000 }), ctx("green-view"));

    expect(db.roommatePost.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { hostelId_userId: { hostelId: "hst_1", userId: "usr_student_1" } },
        update: expect.objectContaining({ expiresAt: expect.any(Date) }),
      }),
    );
    expect(res.status).toBe(201);
  });
});
