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

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(),
}));

import { GET, POST } from "./route";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

function studentSession() {
  return { user: { id: "usr_student_1", role: "STUDENT" } } as any;
}

function ownerSession() {
  return { user: { id: "usr_owner_1", role: "OWNER" } } as any;
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
  vi.mocked(auth).mockResolvedValue(null as any);
  vi.mocked(rateLimit).mockResolvedValue({ ok: true, remaining: 9, resetAt: 0 });
});

describe("GET /api/hostels/[param]/roommates", () => {
  it("requires a signed-in student", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const res = await GET(getReq(), ctx("green-view"));

    expect(res.status).toBe(401);
    expect(db.hostel.findFirst).not.toHaveBeenCalled();
  });

  it("returns 404 when the hostel doesn't exist or isn't active", async () => {
    vi.mocked(auth).mockResolvedValue(studentSession());
    vi.mocked(db.hostel.findFirst).mockResolvedValue(null);

    const res = await GET(getReq(), ctx("nonexistent"));

    expect(res.status).toBe(404);
  });

  it("returns 403 when an owner requests roommate details", async () => {
    vi.mocked(auth).mockResolvedValue(ownerSession());

    const res = await GET(getReq(), ctx("green-view"));

    expect(res.status).toBe(403);
    expect(db.hostel.findFirst).not.toHaveBeenCalled();
    expect(db.roommatePost.findMany).not.toHaveBeenCalled();
  });

  it("resolves the hostel by id or slug", async () => {
    vi.mocked(auth).mockResolvedValue(studentSession());
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
    vi.mocked(auth).mockResolvedValue(studentSession());
    vi.mocked(db.hostel.findFirst).mockResolvedValue(makeHostel() as any);
    vi.mocked(db.roommatePost.findMany).mockResolvedValue([makePost()] as any);

    const res = await GET(getReq(), ctx("green-view"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
  });

  it("keeps posts with one or two reports visible and hides posts at three reports", async () => {
    vi.mocked(auth).mockResolvedValue(studentSession());
    vi.mocked(db.hostel.findFirst).mockResolvedValue(makeHostel() as any);
    vi.mocked(db.roommatePost.findMany).mockResolvedValue([
      makePost({ id: "clean", _count: { reports: 0 } }),
      makePost({ id: "reported-once", _count: { reports: 1 } }),
      makePost({ id: "reported-twice", _count: { reports: 2 } }),
      makePost({ id: "hidden", _count: { reports: 3 } }),
    ] as any);

    const res = await GET(getReq(), ctx("green-view"));
    const body = await res.json();

    expect(db.roommatePost.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({ reports: expect.anything() }),
      }),
    );
    expect(body.data.map((post: any) => post.id)).toEqual([
      "clean",
      "reported-once",
      "reported-twice",
    ]);
  });

  it("excludes a post once it has reached the report threshold", async () => {
    vi.mocked(auth).mockResolvedValue(studentSession());
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

  it("returns 403 when an owner tries to post a roommate request", async () => {
    vi.mocked(auth).mockResolvedValue(ownerSession());

    const res = await POST(postReq({ bio: "hi" }), ctx("green-view"));

    expect(res.status).toBe(403);
    expect(db.hostel.findFirst).not.toHaveBeenCalled();
    expect(db.roommatePost.upsert).not.toHaveBeenCalled();
  });

  it("rate-limits student post edits before looking up the hostel", async () => {
    vi.mocked(auth).mockResolvedValue(studentSession());
    vi.mocked(rateLimit).mockResolvedValue({ ok: false, remaining: 0, resetAt: 1 });

    const res = await POST(postReq({ bio: "Looking for a roommate" }), ctx("green-view"));

    expect(res.status).toBe(429);
    expect(db.hostel.findFirst).not.toHaveBeenCalled();
    expect(db.roommatePost.upsert).not.toHaveBeenCalled();
  });

  it("rejects an oversized post body", async () => {
    vi.mocked(auth).mockResolvedValue(studentSession());

    const res = await POST(postReq({ bio: "x".repeat(5_000) }), ctx("green-view"));

    expect(res.status).toBe(413);
    expect(db.hostel.findFirst).not.toHaveBeenCalled();
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
