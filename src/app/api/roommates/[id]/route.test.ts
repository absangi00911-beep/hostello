import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  postDeleteMany: vi.fn(),
  rateLimit: vi.fn(),
}));

vi.mock("@/lib/auth/config", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({
  db: { roommatePost: { deleteMany: mocks.postDeleteMany } },
}));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: mocks.rateLimit }));

import { DELETE } from "@/app/api/roommates/[id]/route";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

const POST_ID = "rmp_1";

function session(userId: string) {
  return { user: { id: userId } } as unknown as Awaited<ReturnType<typeof auth>>;
}

function request() {
  return new NextRequest(`https://hostello.pk/api/roommates/${POST_ID}`, { method: "DELETE" });
}

function context(id = POST_ID) {
  return { params: Promise.resolve({ id }) };
}

describe("DELETE /api/roommates/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.postDeleteMany.mockResolvedValue({ count: 1 });
    mocks.rateLimit.mockResolvedValue({ ok: true, remaining: 29, resetAt: Date.now() + 60_000 });
  });

  it("requires a signed-in user", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null);

    const response = await DELETE(request(), context());

    expect(response.status).toBe(401);
    expect(db.roommatePost.deleteMany).not.toHaveBeenCalled();
  });

  it("returns 404 for a missing post", async () => {
    vi.mocked(auth).mockResolvedValueOnce(session("author-1"));
    vi.mocked(db.roommatePost.deleteMany).mockResolvedValueOnce({ count: 0 } as any);

    const response = await DELETE(request(), context());

    expect(response.status).toBe(404);
    expect(db.roommatePost.deleteMany).toHaveBeenCalledWith({
      where: { id: POST_ID, userId: "author-1" },
    });
  });

  it("does not reveal or delete another user's post", async () => {
    vi.mocked(auth).mockResolvedValueOnce(session("other-user"));
    vi.mocked(db.roommatePost.deleteMany).mockResolvedValueOnce({ count: 0 } as any);

    const response = await DELETE(request(), context());

    expect(response.status).toBe(404);
    expect(db.roommatePost.deleteMany).toHaveBeenCalledWith({
      where: { id: POST_ID, userId: "other-user" },
    });
  });

  it("deletes the post owned by the signed-in user", async () => {
    vi.mocked(auth).mockResolvedValueOnce(session("author-1"));

    const response = await DELETE(request(), context());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(db.roommatePost.deleteMany).toHaveBeenCalledWith({
      where: { id: POST_ID, userId: "author-1" },
    });
  });

  it("rate-limits deletion before looking up a post", async () => {
    vi.mocked(auth).mockResolvedValueOnce(session("author-1"));
    mocks.rateLimit.mockResolvedValueOnce({ ok: false, remaining: 0, resetAt: Date.now() + 60_000 });

    const response = await DELETE(request(), context());

    expect(response.status).toBe(429);
    expect(Number(response.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(mocks.rateLimit).toHaveBeenCalledWith("roommate-post-delete:author-1", {
      limit: 30,
      windowMs: 60_000,
    });
    expect(db.roommatePost.deleteMany).not.toHaveBeenCalled();
  });
});
