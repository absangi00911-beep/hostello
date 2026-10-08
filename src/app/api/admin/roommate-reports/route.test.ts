import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

vi.mock("@/lib/auth/config", () => ({ auth: vi.fn() }));
vi.mock("@/lib/admin-read-limit", () => ({ enforceAdminReadLimit: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: { roommatePost: { findMany: vi.fn(), count: vi.fn() } },
}));

import { GET } from "./route";
import { auth } from "@/lib/auth/config";
import { enforceAdminReadLimit } from "@/lib/admin-read-limit";
import { db } from "@/lib/db";

function request() {
  return new NextRequest("https://hostello.test/api/admin/roommate-reports");
}

describe("GET /api/admin/roommate-reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(enforceAdminReadLimit).mockResolvedValue(null);
  });

  it("requires an admin before checking the admin-read quota", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "usr_student", role: "STUDENT" } } as any);

    const response = await GET(request());

    expect(response.status).toBe(403);
    expect(enforceAdminReadLimit).not.toHaveBeenCalled();
    expect(db.roommatePost.findMany).not.toHaveBeenCalled();
  });

  it("applies the shared admin read quota before querying report details", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "usr_admin", role: "ADMIN" } } as any);
    vi.mocked(enforceAdminReadLimit).mockResolvedValueOnce(NextResponse.json(
      { error: "Too many admin requests. Please slow down." },
      { status: 429, headers: { "Retry-After": "30" } },
    ));

    const response = await GET(request());

    expect(response.status).toBe(429);
    expect(enforceAdminReadLimit).toHaveBeenCalledWith("usr_admin");
    expect(db.roommatePost.findMany).not.toHaveBeenCalled();
    expect(db.roommatePost.count).not.toHaveBeenCalled();
  });
});
