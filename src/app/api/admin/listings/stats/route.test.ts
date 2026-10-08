import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/config", () => ({ auth: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn() }));

vi.mock("@/lib/db", () => ({
  db: {
    hostel: { count: vi.fn(), findMany: vi.fn() },
  },
}));

import { GET } from "./route";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(rateLimit).mockResolvedValue({ ok: true, remaining: 9, resetAt: Date.now() + 60_000 });
  vi.mocked(db.hostel.count).mockResolvedValue(0);
  vi.mocked(db.hostel.findMany).mockResolvedValue([] as never);
});

describe("GET /api/admin/listings/stats", () => {
  it("requires an admin session before querying listing data", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "student_1", role: "STUDENT" } } as never);

    const response = await GET();

    expect(response.status).toBe(403);
    expect(db.hostel.count).not.toHaveBeenCalled();
    expect(db.hostel.findMany).not.toHaveBeenCalled();
  });

  it("scores the full pending queue while fetching each page in a bounded batch", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "admin_1", role: "ADMIN" } } as never);
    const completeListing = Array.from({ length: 200 }, (_, index) => ({
      id: `hostel_${String(index).padStart(3, "0")}`,
      images: ["one", "two", "three", "four", "five"],
      description: "x".repeat(200),
      amenities: ["one", "two", "three", "four", "five"],
      rules: ["one"],
    }));
    vi.mocked(db.hostel.findMany)
      .mockResolvedValueOnce(completeListing as never)
      .mockResolvedValueOnce([{
        id: "hostel_201",
        images: [],
        description: "",
        amenities: [],
        rules: [],
      }] as never);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.flaggedCount).toBe(1);
    expect(db.hostel.findMany).toHaveBeenNthCalledWith(1, expect.objectContaining({
      take: 200,
      orderBy: { id: "asc" },
    }));
    expect(db.hostel.findMany).toHaveBeenNthCalledWith(2, expect.objectContaining({
      take: 200,
      cursor: { id: "hostel_199" },
      skip: 1,
    }));
  });

  it("throttles before global listing aggregation and completeness scans", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "admin_1", role: "ADMIN" } } as never);
    vi.mocked(rateLimit).mockResolvedValueOnce({ ok: false, remaining: 0, resetAt: Date.now() + 60_000 });

    const response = await GET();

    expect(response.status).toBe(429);
    expect(Number(response.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(rateLimit).toHaveBeenCalledWith("admin-listing-stats:admin_1", {
      limit: 10,
      windowMs: 60_000,
    });
    expect(db.hostel.count).not.toHaveBeenCalled();
    expect(db.hostel.findMany).not.toHaveBeenCalled();
  });
});
