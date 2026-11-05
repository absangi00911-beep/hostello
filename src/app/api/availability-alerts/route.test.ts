import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/config", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    availabilityAlert: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn() }));
vi.mock("@/lib/availability-alerts", () => ({
  AvailabilityAlertHostelUnavailableError: class extends Error {},
  AvailabilityAlertValidationError: class extends Error {},
  createAvailabilityAlert: vi.fn(),
  deleteAvailabilityAlert: vi.fn(),
  expireAvailabilityAlerts: vi.fn(),
  serializeAvailabilityAlert: vi.fn((alert: { id: string }) => ({ id: alert.id })),
  updateAvailabilityAlert: vi.fn(),
}));

import { GET, POST } from "@/app/api/availability-alerts/route";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import {
  createAvailabilityAlert,
  expireAvailabilityAlerts,
} from "@/lib/availability-alerts";

describe("/api/availability-alerts collection route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({
      user: { id: "student-1", role: "STUDENT" },
      expires: "2030-01-01T00:00:00.000Z",
    });
    vi.mocked(rateLimit).mockResolvedValue({
      ok: true,
      remaining: 59,
      resetAt: Date.now() + 60_000,
    });
    vi.mocked(expireAvailabilityAlerts).mockResolvedValue({ count: 0 });
    vi.mocked(db.availabilityAlert.findMany).mockResolvedValue([
      { id: "alert-1" },
    ] as Awaited<ReturnType<typeof db.availabilityAlert.findMany>>);
    vi.mocked(db.availabilityAlert.count).mockResolvedValue(1);
    vi.mocked(createAvailabilityAlert).mockResolvedValue({ id: "alert-2" } as never);
  });

  it("lists a student's own paginated alerts and expires stale rows first", async () => {
    const response = await GET(
      new NextRequest("https://hostello.test/api/availability-alerts?page=2&limit=10"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      data: [{ id: "alert-1" }],
      total: 1,
      page: 2,
      limit: 10,
      hasMore: false,
    });
    expect(expireAvailabilityAlerts).toHaveBeenCalledWith(
      expect.any(Date),
      db,
      "student-1",
    );
    expect(db.availabilityAlert.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "student-1" },
        skip: 10,
        take: 10,
      }),
    );
  });

  it("rejects owners and admins from the student alert API", async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: "owner-1", role: "OWNER" },
      expires: "2030-01-01T00:00:00.000Z",
    });

    const response = await GET(
      new NextRequest("https://hostello.test/api/availability-alerts"),
    );

    expect(response.status).toBe(403);
    expect(db.availabilityAlert.findMany).not.toHaveBeenCalled();
  });

  it("creates a date-aware hostel alert for the authenticated student", async () => {
    const input = {
      type: "HOSTEL",
      hostelId: "hostel-1",
      checkIn: "2030-03-20",
      checkOut: "2030-03-22",
      guests: 2,
    };
    const response = await POST(
      new NextRequest("https://hostello.test/api/availability-alerts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      }),
    );

    expect(response.status).toBe(201);
    expect(createAvailabilityAlert).toHaveBeenCalledWith(
      "student-1",
      input,
      expect.anything(),
      expect.any(Date),
    );
  });

  it("rejects invalid alert input before writing", async () => {
    const response = await POST(
      new NextRequest("https://hostello.test/api/availability-alerts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "HOSTEL",
          hostelId: "hostel-1",
          checkIn: "2030-03-20",
          checkOut: "2030-03-22",
          guests: 5,
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(createAvailabilityAlert).not.toHaveBeenCalled();
  });

  it("applies rate limiting before reading the create body", async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({
      ok: false,
      remaining: 0,
      resetAt: Date.now() + 10_000,
    });
    const response = await POST(
      new NextRequest("https://hostello.test/api/availability-alerts", {
        method: "POST",
        body: "not-json",
      }),
    );

    expect(response.status).toBe(429);
    expect(createAvailabilityAlert).not.toHaveBeenCalled();
  });
});
