import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  deleteMany: vi.fn(),
  rateLimit: vi.fn(),
}));

vi.mock("@/lib/auth/config", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({ db: { roommatePost: { deleteMany: mocks.deleteMany } } }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: mocks.rateLimit }));

import { DELETE } from "@/app/api/admin/roommate-reports/[postId]/route";

function request() {
  return new NextRequest("https://hostello.test/api/admin/roommate-reports/post_1", { method: "DELETE" });
}

describe("DELETE /api/admin/roommate-reports/[postId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "admin_1", role: "ADMIN" } });
    mocks.deleteMany.mockResolvedValue({ count: 1 });
    mocks.rateLimit.mockResolvedValue({ ok: true, remaining: 29, resetAt: Date.now() + 60_000 });
  });

  it("requires admin authorization", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "owner_1", role: "OWNER" } });

    const response = await DELETE(request(), { params: Promise.resolve({ postId: "post_1" }) });

    expect(response.status).toBe(403);
    expect(mocks.deleteMany).not.toHaveBeenCalled();
  });

  it("limits moderation before querying or deleting a report", async () => {
    mocks.rateLimit.mockResolvedValue({ ok: false, remaining: 0, resetAt: Date.now() + 30_000 });

    const response = await DELETE(request(), { params: Promise.resolve({ postId: "post_1" }) });

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
    expect(mocks.deleteMany).not.toHaveBeenCalled();
  });

  it("deletes only a currently reported post", async () => {
    const response = await DELETE(request(), { params: Promise.resolve({ postId: "post_1" }) });

    expect(response.status).toBe(200);
    expect(mocks.deleteMany).toHaveBeenCalledWith({ where: { id: "post_1", reports: { some: {} } } });
  });
});
