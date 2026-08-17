// Path: src/app/api/roommates/[id]/route.test.ts
//
// Note: as of this writing, this route.ts (POST) and
// src/app/api/roommates/[id]/report/route.ts are byte-for-byte identical —
// both implement "report a post." A bare POST to a resource's own /[id] isn't
// a natural spot for a "report" action (GET for viewing, PATCH/DELETE for
// edit/remove would be the expected shapes there), which suggests this file
// may have been meant to hold something else — most plausibly a DELETE for
// the post's own author, or an admin moderation action, given there's
// currently no way for anyone to remove a roommate post at all once it
// exists. See the session summary. Covered here regardless, since until
// that's resolved this file's actual behavior is exactly the report route's.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    roommatePost: {
      findUnique: vi.fn(),
    },
    roommateReport: {
      upsert: vi.fn(),
    },
  },
}));

import { POST } from "./route";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

function session(userId: string) {
  return { user: { id: userId } } as any;
}

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

function req(body: unknown) {
  return new NextRequest("https://hostello.test/api/roommates/rmp_1", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/roommates/[id]", () => {
  it("returns 401 with no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const res = await POST(req({ reason: "spam" }), ctx("rmp_1"));

    expect(res.status).toBe(401);
  });

  it("returns 400 when reason is missing", async () => {
    vi.mocked(auth).mockResolvedValue(session("usr_reporter"));

    const res = await POST(req({}), ctx("rmp_1"));

    expect(res.status).toBe(400);
  });

  it("returns 404 when the post doesn't exist", async () => {
    vi.mocked(auth).mockResolvedValue(session("usr_reporter"));
    vi.mocked(db.roommatePost.findUnique).mockResolvedValue(null);

    const res = await POST(req({ reason: "spam" }), ctx("nonexistent"));

    expect(res.status).toBe(404);
  });

  it("rejects reporting your own post", async () => {
    vi.mocked(auth).mockResolvedValue(session("usr_author"));
    vi.mocked(db.roommatePost.findUnique).mockResolvedValue({ userId: "usr_author" } as any);

    const res = await POST(req({ reason: "spam" }), ctx("rmp_1"));

    expect(res.status).toBe(400);
    expect(db.roommateReport.upsert).not.toHaveBeenCalled();
  });

  it("creates a report from a different user", async () => {
    vi.mocked(auth).mockResolvedValue(session("usr_reporter"));
    vi.mocked(db.roommatePost.findUnique).mockResolvedValue({ userId: "usr_author" } as any);
    vi.mocked(db.roommateReport.upsert).mockResolvedValue({} as any);

    const res = await POST(req({ reason: "Fake profile" }), ctx("rmp_1"));

    expect(db.roommateReport.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { postId_reporterId: { postId: "rmp_1", reporterId: "usr_reporter" } },
      }),
    );
    expect(res.status).toBe(200);
  });
});
