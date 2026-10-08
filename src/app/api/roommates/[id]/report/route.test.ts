import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    roommatePost: { findUnique: vi.fn() },
    roommateReport: { upsert: vi.fn() },
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(),
}));

import { POST } from "./route";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

function session(userId: string, role = "STUDENT") {
  return { user: { id: userId, role } } as any;
}

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

function req(body: unknown) {
  return new NextRequest("https://hostello.test/api/roommates/rmp_1/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(rateLimit).mockResolvedValue({ ok: true, remaining: 4, resetAt: 0 });
});

describe("POST /api/roommates/[id]/report", () => {
  it("returns 401 with no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const res = await POST(req({ reason: "Spam" }), ctx("rmp_1"));

    expect(res.status).toBe(401);
    expect(rateLimit).not.toHaveBeenCalled();
  });

  it("allows reports from students only", async () => {
    vi.mocked(auth).mockResolvedValue(session("usr_owner", "OWNER"));

    const res = await POST(req({ reason: "Spam" }), ctx("rmp_1"));

    expect(res.status).toBe(403);
    expect(rateLimit).not.toHaveBeenCalled();
    expect(db.roommatePost.findUnique).not.toHaveBeenCalled();
  });

  it("rate-limits a student before reading or processing the report", async () => {
    vi.mocked(auth).mockResolvedValue(session("usr_reporter"));
    vi.mocked(rateLimit).mockResolvedValue({ ok: false, remaining: 0, resetAt: 1 });

    const res = await POST(req({ reason: "Spam" }), ctx("rmp_1"));

    expect(res.status).toBe(429);
    expect(rateLimit).toHaveBeenCalledWith("roommate-report:usr_reporter", {
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });
    expect(db.roommatePost.findUnique).not.toHaveBeenCalled();
  });

  it("rejects an oversized post ID before reading the post", async () => {
    vi.mocked(auth).mockResolvedValue(session("usr_reporter"));

    const res = await POST(req({ reason: "Spam" }), ctx("x".repeat(129)));

    expect(res.status).toBe(400);
    expect(db.roommatePost.findUnique).not.toHaveBeenCalled();
  });

  it.each([
    ["missing", {}],
    ["blank", { reason: "  " }],
    ["too short", { reason: "ok" }],
    ["non-string", { reason: 123 }],
    ["too long", { reason: "x".repeat(501) }],
    ["non-object JSON", null],
  ])("returns 400 for a %s reason", async (_name, body) => {
    vi.mocked(auth).mockResolvedValue(session("usr_reporter"));

    const res = await POST(req(body), ctx("rmp_1"));

    expect(res.status).toBe(400);
    expect(db.roommatePost.findUnique).not.toHaveBeenCalled();
  });

  it("rejects an oversized body", async () => {
    vi.mocked(auth).mockResolvedValue(session("usr_reporter"));

    const res = await POST(req({ reason: "x".repeat(2_100) }), ctx("rmp_1"));

    expect(res.status).toBe(413);
    expect(db.roommatePost.findUnique).not.toHaveBeenCalled();
  });

  it("returns 404 when the post does not exist", async () => {
    vi.mocked(auth).mockResolvedValue(session("usr_reporter"));
    vi.mocked(db.roommatePost.findUnique).mockResolvedValue(null);

    const res = await POST(req({ reason: "Spam" }), ctx("nonexistent"));

    expect(res.status).toBe(404);
  });

  it("rejects reporting your own post", async () => {
    vi.mocked(auth).mockResolvedValue(session("usr_author"));
    vi.mocked(db.roommatePost.findUnique).mockResolvedValue({ userId: "usr_author" } as any);

    const res = await POST(req({ reason: "Spam" }), ctx("rmp_1"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("own post");
    expect(db.roommateReport.upsert).not.toHaveBeenCalled();
  });

  it("creates a trimmed report from a different student", async () => {
    vi.mocked(auth).mockResolvedValue(session("usr_reporter"));
    vi.mocked(db.roommatePost.findUnique).mockResolvedValue({ userId: "usr_author" } as any);
    vi.mocked(db.roommateReport.upsert).mockResolvedValue({} as any);

    const res = await POST(req({ reason: "  Fake profile  " }), ctx("rmp_1"));

    expect(db.roommateReport.upsert).toHaveBeenCalledWith({
      where: { postId_reporterId: { postId: "rmp_1", reporterId: "usr_reporter" } },
      create: { postId: "rmp_1", reporterId: "usr_reporter", reason: "Fake profile" },
      update: { reason: "Fake profile" },
    });
    expect(res.status).toBe(200);
  });

  it("updates an existing report without creating a duplicate report row", async () => {
    vi.mocked(auth).mockResolvedValue(session("usr_reporter"));
    vi.mocked(db.roommatePost.findUnique).mockResolvedValue({ userId: "usr_author" } as any);
    vi.mocked(db.roommateReport.upsert).mockResolvedValue({} as any);

    await POST(req({ reason: "Updated reason" }), ctx("rmp_1"));

    expect(db.roommateReport.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: { reason: "Updated reason" } }),
    );
  });
});
