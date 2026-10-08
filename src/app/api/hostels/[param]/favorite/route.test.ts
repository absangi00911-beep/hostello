import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  rateLimit: vi.fn(),
  hostelFindFirst: vi.fn(),
  favoriteUpsert: vi.fn(),
  favoriteDeleteMany: vi.fn(),
}));

vi.mock("@/lib/auth/config", () => ({ auth: mocks.auth }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: mocks.rateLimit }));
vi.mock("@/lib/db", () => ({
  db: {
    hostel: { findFirst: mocks.hostelFindFirst },
    favorite: {
      upsert: mocks.favoriteUpsert,
      deleteMany: mocks.favoriteDeleteMany,
    },
  },
}));

import { DELETE, POST } from "@/app/api/hostels/[param]/favorite/route";

function makeRequest(method: "POST" | "DELETE") {
  return new NextRequest("https://hostello.test/api/hostels/lake-view/favorite", { method });
}

function makeContext(param = "lake-view") {
  return { params: Promise.resolve({ param }) };
}

describe("favorite mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "student-1", role: "STUDENT" } });
    mocks.rateLimit.mockResolvedValue({ ok: true, remaining: 59, resetAt: Date.now() + 60_000 });
    mocks.hostelFindFirst.mockResolvedValue({ id: "hostel-1" });
    mocks.favoriteUpsert.mockResolvedValue({});
    mocks.favoriteDeleteMany.mockResolvedValue({ count: 1 });
  });

  it("allows only students to save or remove favorite hostels", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "owner-1", role: "OWNER" } });

    const response = await POST(makeRequest("POST"), makeContext());

    expect(response.status).toBe(403);
    expect(mocks.rateLimit).not.toHaveBeenCalled();
    expect(mocks.hostelFindFirst).not.toHaveBeenCalled();
    expect(mocks.favoriteUpsert).not.toHaveBeenCalled();
  });

  it("throttles favorite changes before querying the hostel", async () => {
    mocks.rateLimit.mockResolvedValue({ ok: false, remaining: 0, resetAt: Date.now() + 60_000 });

    const response = await POST(makeRequest("POST"), makeContext());

    expect(response.status).toBe(429);
    expect(mocks.rateLimit).toHaveBeenCalledWith("favorite:student-1", {
      limit: 60,
      windowMs: 60_000,
    });
    expect(mocks.hostelFindFirst).not.toHaveBeenCalled();
  });

  it("upserts the current student's favorite", async () => {
    const response = await POST(makeRequest("POST"), makeContext());

    expect(response.status).toBe(200);
    expect(mocks.hostelFindFirst).toHaveBeenCalledWith({
      where: { slug: "lake-view", status: "ACTIVE" },
      select: { id: true },
    });
    expect(mocks.favoriteUpsert).toHaveBeenCalledWith({
      where: { userId_hostelId: { userId: "student-1", hostelId: "hostel-1" } },
      update: {},
      create: { userId: "student-1", hostelId: "hostel-1" },
    });
  });

  it("does not let students save an inactive listing", async () => {
    mocks.hostelFindFirst.mockResolvedValue(null);

    const response = await POST(makeRequest("POST"), makeContext());

    expect(response.status).toBe(404);
    expect(mocks.favoriteUpsert).not.toHaveBeenCalled();
  });

  it("removes only the current student's favorite without looking up a listing", async () => {
    const response = await DELETE(makeRequest("DELETE"), makeContext());

    expect(response.status).toBe(200);
    expect(mocks.favoriteDeleteMany).toHaveBeenCalledWith({
      where: { userId: "student-1", hostel: { is: { slug: "lake-view" } } },
    });
    expect(mocks.hostelFindFirst).not.toHaveBeenCalled();
  });

  it("returns the same result when no current-user favorite matches the slug", async () => {
    mocks.favoriteDeleteMany.mockResolvedValue({ count: 0 });

    const response = await DELETE(makeRequest("DELETE"), makeContext());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ saved: false });
    expect(mocks.favoriteDeleteMany).toHaveBeenCalledWith({
      where: { userId: "student-1", hostel: { is: { slug: "lake-view" } } },
    });
  });
});
