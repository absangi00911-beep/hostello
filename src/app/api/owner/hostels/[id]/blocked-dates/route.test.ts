import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/config", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    hostel: { findFirst: vi.fn() },
    blockedDate: { findMany: vi.fn(), count: vi.fn(), create: vi.fn(), deleteMany: vi.fn() },
  },
}));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn() }));

import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { DELETE, GET, POST } from "./route";

const context = { params: Promise.resolve({ id: "hostel_1" }) };
const getRequest = () => new NextRequest("https://hostello.test/api/owner/hostels/hostel_1/blocked-dates");
const pagedGetRequest = (page: number, limit: number) => new NextRequest(
  `https://hostello.test/api/owner/hostels/hostel_1/blocked-dates?page=${page}&limit=${limit}`,
);
const postRequest = () => new NextRequest("https://hostello.test/api/owner/hostels/hostel_1/blocked-dates", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ startDate: "2026-10-10", endDate: "2026-10-12", reason: "Repairs" }),
});
const deleteRequest = () => new NextRequest("https://hostello.test/api/owner/hostels/hostel_1/blocked-dates", {
  method: "DELETE",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ id: "blocked_1" }),
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth).mockResolvedValue({ user: { id: "owner_1", role: "OWNER" } } as any);
  vi.mocked(db.hostel.findFirst).mockResolvedValue({ id: "hostel_1" } as any);
  vi.mocked(db.blockedDate.count).mockResolvedValue(0);
  vi.mocked(rateLimit).mockResolvedValue({ ok: true, remaining: 59, resetAt: Date.now() + 3_600_000 });
});

describe("owner blocked-date role boundary", () => {
  it.each([
    ["GET", GET, getRequest],
    ["POST", POST, postRequest],
    ["DELETE", DELETE, deleteRequest],
  ] as const)("rejects a signed-in student from %s before resource lookup", async (_method, handler, request) => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "student_1", role: "STUDENT" } } as any);

    const response = await handler(request(), context as any);

    expect(response.status).toBe(403);
    expect(db.hostel.findFirst).not.toHaveBeenCalled();
    expect(db.blockedDate.findMany).not.toHaveBeenCalled();
    expect(db.blockedDate.create).not.toHaveBeenCalled();
    expect(db.blockedDate.deleteMany).not.toHaveBeenCalled();
  });

  it("keeps reads scoped to the authenticated owner and requested hostel", async () => {
    vi.mocked(db.blockedDate.findMany).mockResolvedValue([] as any);

    const response = await GET(getRequest(), context as any);

    expect(response.status).toBe(200);
    expect(db.hostel.findFirst).toHaveBeenCalledWith({
      where: { id: "hostel_1", ownerId: "owner_1" },
      select: { id: true },
    });
    expect(db.blockedDate.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { hostelId: "hostel_1", hostel: { is: { ownerId: "owner_1" } } },
      orderBy: [{ startDate: "asc" }, { id: "asc" }],
      skip: 0,
      take: 20,
    }));
    expect(db.blockedDate.count).toHaveBeenCalledWith({
      where: { hostelId: "hostel_1", hostel: { is: { ownerId: "owner_1" } } },
    });
  });

  it("rechecks current hostel ownership in the blocked-date create relation", async () => {
    vi.mocked(db.blockedDate.create).mockResolvedValue({
      id: "blocked_1",
      startDate: new Date("2026-10-10"),
      endDate: new Date("2026-10-12"),
      reason: "Repairs",
    } as any);

    const response = await POST(postRequest(), context as any);

    expect(response.status).toBe(201);
    expect(db.blockedDate.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        hostel: { connect: { id: "hostel_1", ownerId: "owner_1" } },
        startDate: new Date("2026-10-10"),
        endDate: new Date("2026-10-12"),
        reason: "Repairs",
      }),
    }));
  });

  it("scopes blocked-date deletion to the current owner relation", async () => {
    const response = await DELETE(deleteRequest(), context as any);

    expect(response.status).toBe(200);
    expect(db.blockedDate.deleteMany).toHaveBeenCalledWith({
      where: {
        id: "blocked_1",
        hostelId: "hostel_1",
        hostel: { is: { ownerId: "owner_1" } },
      },
    });
  });

  it("bounds blocked-date reads and reports the requested page", async () => {
    vi.mocked(db.blockedDate.findMany).mockResolvedValue([
      { id: "blocked_5", startDate: new Date("2026-10-10"), endDate: new Date("2026-10-10"), reason: null },
      { id: "blocked_6", startDate: new Date("2026-10-11"), endDate: new Date("2026-10-11"), reason: null },
    ] as any);
    vi.mocked(db.blockedDate.count).mockResolvedValue(6);

    const response = await GET(pagedGetRequest(3, 2), context as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ page: 3, limit: 2, total: 6, hasMore: false });
    expect(db.blockedDate.findMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 4,
      take: 2,
    }));
  });
});
