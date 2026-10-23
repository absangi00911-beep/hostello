import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/config", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    booking: { findFirst: vi.fn(), findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/email-templates/booking-status", () => ({ bookingStatusEmail: vi.fn() }));
vi.mock("@/lib/notifications", () => ({ createNotification: vi.fn() }));

import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notifications";
import { hashOperationalIdentifier } from "@/lib/operational-logger";
import { GET, PATCH } from "./route";

const tx = {
  booking: { updateMany: vi.fn() },
  room: { update: vi.fn() },
};

const booking = {
  id: "booking_1",
  status: "PENDING",
  createdAt: new Date(Date.now() - 60 * 60 * 1000),
  ownerResponseDueAt: new Date(Date.now() + 60 * 60 * 1000),
  checkIn: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
  checkOut: new Date(Date.now() + 24 * 60 * 60 * 1000),
  total: 45_000,
  paymentStatus: "PENDING",
  cancellationPolicy: "STANDARD",
  payoutId: null,
  roomId: "room_1",
  guests: 3,
  hostelId: "hostel_1",
  userId: "student_1",
  hostel: { ownerId: "owner_1", name: "Hostel One", slug: "hostel-one" },
  user: { name: "Student One", email: "student@example.test" },
};

function session(id: string, role: string) {
  return { user: { id, role } } as any;
}

function request(action: string) {
  return new NextRequest("https://hostello.test/api/bookings/booking_1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
}

async function patch(action: string, id = booking.id) {
  return PATCH(request(action), { params: Promise.resolve({ id }) });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(rateLimit).mockResolvedValue({ ok: true, remaining: 29, resetAt: 0 });
  vi.mocked(db.booking.findFirst).mockResolvedValue(booking as any);
  vi.mocked(db.booking.findUnique).mockResolvedValue(null);
  vi.mocked(db.$transaction).mockImplementation((async (callback: any) => callback(tx)) as any);
  tx.booking.updateMany.mockResolvedValue({ count: 1 });
  tx.room.update.mockResolvedValue({});
});

describe("PATCH /api/bookings/[id]", () => {
  it("rejects oversized booking IDs before querying the database", async () => {
    vi.mocked(auth).mockResolvedValue(session("student_1", "STUDENT"));

    const response = await patch("cancel", "x".repeat(65));

    expect(response.status).toBe(400);
    expect(db.booking.findFirst).not.toHaveBeenCalled();
  });

  it("hides a booking from a student who is not a participant when cancelling", async () => {
    vi.mocked(auth).mockResolvedValue(session("student_2", "STUDENT"));
    vi.mocked(db.booking.findFirst).mockResolvedValue(null);

    const response = await patch("cancel");

    expect(response.status).toBe(404);
    expect(tx.booking.updateMany).not.toHaveBeenCalled();
  });

  it("hides a booking from an unrelated owner when confirming", async () => {
    vi.mocked(auth).mockResolvedValue(session("owner_2", "OWNER"));
    vi.mocked(db.booking.findFirst).mockResolvedValue(null);

    const response = await patch("confirm");

    expect(response.status).toBe(404);
    expect(tx.booking.updateMany).not.toHaveBeenCalled();
  });

  it("keeps a forbidden response when the booking student tries owner confirmation", async () => {
    vi.mocked(auth).mockResolvedValue(session("student_1", "STUDENT"));

    const response = await patch("confirm");

    expect(response.status).toBe(403);
  });

  it("keeps a forbidden response when the hostel owner tries to cancel", async () => {
    vi.mocked(auth).mockResolvedValue(session("owner_1", "OWNER"));

    const response = await patch("cancel");

    expect(response.status).toBe(403);
  });

  it("cancels once and restores the room only after the conditional transition", async () => {
    vi.mocked(auth).mockResolvedValue(session("student_1", "STUDENT"));

    const response = await patch("cancel");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(tx.booking.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: booking.id,
        status: "PENDING",
        payoutId: null,
        paymentStatus: "PENDING",
        userId: "student_1",
      }),
      data: { status: "CANCELLED", cancellationRefundAmount: 0 },
    }));
    expect(tx.room.update).toHaveBeenCalledWith({
      where: { id: "room_1" },
      data: { available: { increment: 3 }, version: { increment: 1 } },
    });
    expect(body.data.status).toBe("CANCELLED");
  });

  it("does not restore inventory or send notifications if another action won the race", async () => {
    vi.mocked(auth).mockResolvedValue(session("student_1", "STUDENT"));
    tx.booking.updateMany.mockResolvedValue({ count: 0 });

    const response = await patch("cancel");

    expect(response.status).toBe(409);
    expect(tx.room.update).not.toHaveBeenCalled();
    expect(createNotification).not.toHaveBeenCalled();
  });

  it("rejects a student cancellation after check-out", async () => {
    vi.mocked(auth).mockResolvedValue(session("student_1", "STUDENT"));
    vi.mocked(db.booking.findFirst).mockResolvedValue({
      ...booking,
      checkOut: new Date(Date.now() - 1),
    } as any);

    const response = await patch("cancel");

    expect(response.status).toBe(400);
    expect(tx.booking.updateMany).not.toHaveBeenCalled();
    expect(tx.room.update).not.toHaveBeenCalled();
  });

  it("allows a student to cancel a confirmed booking under its saved cancellation terms", async () => {
    vi.mocked(auth).mockResolvedValue(session("student_1", "STUDENT"));
    vi.mocked(db.booking.findFirst).mockResolvedValue({
      ...booking,
      status: "CONFIRMED",
    } as any);

    const response = await patch("cancel");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({ status: "CANCELLED", cancellationRefundAmount: 0 });
    expect(tx.booking.updateMany).toHaveBeenCalledOnce();
    expect(tx.room.update).toHaveBeenCalledOnce();
  });

  it("does not cancel a booking if a payout batch claims it after the initial read", async () => {
    vi.mocked(auth).mockResolvedValue(session("admin_1", "ADMIN"));
    vi.mocked(db.booking.findFirst).mockResolvedValueOnce({ ...booking, checkOut: new Date(Date.now() - 1) } as any);
    vi.mocked(db.booking.findUnique).mockResolvedValueOnce({ payoutId: "payout_1" } as any);
    tx.booking.updateMany.mockResolvedValue({ count: 0 });

    const response = await patch("cancel");
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toContain("payout batch");
    expect(tx.booking.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: booking.id, status: "PENDING", payoutId: null, paymentStatus: "PENDING" }),
      data: { status: "CANCELLED", cancellationRefundAmount: 0 },
    }));
    expect(tx.room.update).not.toHaveBeenCalled();
    expect(createNotification).not.toHaveBeenCalled();
  });

  it("confirms a pending booking with a compare-and-set and no inventory change", async () => {
    vi.mocked(auth).mockResolvedValue(session("owner_1", "OWNER"));
    vi.mocked(db.booking.findFirst).mockResolvedValue({ ...booking, paymentStatus: "PAID" } as any);

    const response = await patch("confirm");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(tx.booking.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: booking.id,
        status: "PENDING",
        paymentStatus: "PAID",
        hostel: { is: { ownerId: "owner_1" } },
      }),
      data: { status: "CONFIRMED" },
    }));
    expect(tx.room.update).not.toHaveBeenCalled();
    expect(body.data.status).toBe("CONFIRMED");
  });

  it("restores room inventory when the owner declines a pending booking", async () => {
    vi.mocked(auth).mockResolvedValue(session("owner_1", "OWNER"));

    const response = await patch("decline");

    expect(response.status).toBe(200);
    expect(tx.room.update).toHaveBeenCalledTimes(1);
  });

  it("does not transition or restore inventory if hostel ownership changed after authorization", async () => {
    vi.mocked(auth).mockResolvedValue(session("owner_1", "OWNER"));
    tx.booking.updateMany.mockResolvedValue({ count: 0 });

    const response = await patch("decline");

    expect(response.status).toBe(409);
    expect(tx.booking.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: booking.id,
        status: "PENDING",
        paymentStatus: "PENDING",
        hostel: { is: { ownerId: "owner_1" } },
      }),
      data: { status: "CANCELLED" },
    }));
    expect(tx.room.update).not.toHaveBeenCalled();
    expect(createNotification).not.toHaveBeenCalled();
  });

  it("keeps the admin transition available without an owner relation constraint", async () => {
    vi.mocked(auth).mockResolvedValue(session("admin_1", "ADMIN"));
    vi.mocked(db.booking.findFirst).mockResolvedValue({ ...booking, paymentStatus: "PAID" } as any);

    const response = await patch("confirm");

    expect(response.status).toBe(200);
    expect(tx.booking.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: booking.id, status: "PENDING", paymentStatus: "PAID" }),
      data: { status: "CONFIRMED" },
    }));
  });

  it("writes a correlated admin audit event with keyed IDs and no contact or hostel data", async () => {
    vi.stubEnv("AUTH_SECRET", "booking-audit-test-secret");
    vi.mocked(auth).mockResolvedValue(session("admin_1", "ADMIN"));
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);

    try {
      const response = await patch("cancel");
      expect(response.status).toBe(200);

      const [line] = info.mock.calls[0];
      const event = JSON.parse(String(line));
      expect(event).toMatchObject({
        severity: "INFO",
        event: "booking.admin_action",
        attributes: {
          action: "cancel",
          actor_role: "ADMIN",
          actor_id_hash: hashOperationalIdentifier("admin:admin_1"),
          booking_id_hash: hashOperationalIdentifier("booking:booking_1"),
        },
      });
      expect(event.request_id).toBeTruthy();
      expect(String(line)).not.toContain("student@example.test");
      expect(String(line)).not.toContain("Hostel One");
      expect(String(line)).not.toContain("admin_1");
      expect(String(line)).not.toContain("booking_1");
    } finally {
      info.mockRestore();
      vi.unstubAllEnvs();
    }
  });

  it("rejects oversized booking IDs on reads before the database lookup", async () => {
    vi.mocked(auth).mockResolvedValue(session("student_1", "STUDENT"));

    const response = await GET(
      new NextRequest(`https://hostello.test/api/bookings/${"x".repeat(65)}`),
      { params: Promise.resolve({ id: "x".repeat(65) }) },
    );

    expect(response.status).toBe(400);
    expect(db.booking.findFirst).not.toHaveBeenCalled();
  });

  it("throttles repeated state changes before reading the booking", async () => {
    vi.mocked(auth).mockResolvedValue(session("student_1", "STUDENT"));
    vi.mocked(rateLimit).mockResolvedValue({ ok: false, remaining: 0, resetAt: 60_000 });

    const response = await patch("cancel");

    expect(response.status).toBe(429);
    expect(db.booking.findFirst).not.toHaveBeenCalled();
  });
});

describe("GET /api/bookings/[id]", () => {
  it("scopes detail reads to the student or current hostel owner before selecting contact data", async () => {
    vi.mocked(auth).mockResolvedValue(session("student_1", "STUDENT"));

    const response = await GET(new NextRequest("https://hostello.test/api/bookings/booking_1"), {
      params: Promise.resolve({ id: booking.id }),
    });

    expect(response.status).toBe(200);
    expect(db.booking.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        id: booking.id,
        OR: [
          { userId: "student_1" },
          { hostel: { is: { ownerId: "student_1" } } },
        ],
      },
    }));
  });

  it("hides a foreign booking at the query boundary", async () => {
    vi.mocked(auth).mockResolvedValue(session("student_2", "STUDENT"));
    vi.mocked(db.booking.findFirst).mockResolvedValue(null);

    const response = await GET(new NextRequest("https://hostello.test/api/bookings/booking_1"), {
      params: Promise.resolve({ id: booking.id }),
    });

    expect(response.status).toBe(404);
    expect(db.booking.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        id: booking.id,
        OR: [
          { userId: "student_2" },
          { hostel: { is: { ownerId: "student_2" } } },
        ],
      },
    }));
  });

  it("limits booking detail reads before querying the database", async () => {
    vi.mocked(auth).mockResolvedValue(session("student_1", "STUDENT"));
    vi.mocked(rateLimit).mockResolvedValue({ ok: false, remaining: 0, resetAt: Date.now() + 30_000 });

    const response = await GET(new NextRequest("https://hostello.test/api/bookings/booking_1"), {
      params: Promise.resolve({ id: booking.id }),
    });

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("30");
    expect(rateLimit).toHaveBeenCalledWith("booking-detail:student_1", {
      limit: 120,
      windowMs: 60_000,
    });
    expect(db.booking.findFirst).not.toHaveBeenCalled();
  });
});
