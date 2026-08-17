// Path: src/app/api/roommates/[id]/report/route.test.ts
//
// Note: as of this writing, src/app/api/roommates/[id]/route.ts (POST) and this
// file's route.ts are byte-for-byte identical — both implement "report a post."
// That looks unintentional (see the session summary), but until it's resolved
// both files need their own coverage, since either could be the one that
// survives a future cleanup. See route.test.ts one level up for the same suite
// against the other file.

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
  return new NextRequest("https://hostello.test/api/roommates/rmp_1/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/roommates/[id]/report", () => {
  it("returns 401 with no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const res = await POST(req({ reason: "spam" }), ctx("rmp_1"));

    expect(res.status).toBe(401);
  });

  it("returns 400 when reason is missing", async () => {
    vi.mocked(auth).mockResolvedValue(session("usr_reporter"));

    const res = await POST(req({}), ctx("rmp_1"));

    expect(res.status).toBe(400);
    expect(db.roommatePost.findUnique).not.toHaveBeenCalled();
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
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("own post");
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
        create: { postId: "rmp_1", reporterId: "usr_reporter", reason: "Fake profile" },
      }),
    );
    expect(res.status).toBe(200);
  });

  it("updates the reason if the same user reports the same post twice (upsert, not a duplicate row)", async () => {
    vi.mocked(auth).mockResolvedValue(session("usr_reporter"));
    vi.mocked(db.roommatePost.findUnique).mockResolvedValue({ userId: "usr_author" } as any);
    vi.mocked(db.roommateReport.upsert).mockResolvedValue({} as any);

    await POST(req({ reason: "Updated reason" }), ctx("rmp_1"));

    expect(db.roommateReport.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: { reason: "Updated reason" } }),
    );
  });
});
