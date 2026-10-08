import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/config", () => ({ auth: vi.fn() }));

vi.mock("@/lib/db", () => ({
  db: { booking: { findFirst: vi.fn() } },
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirect: vi.fn((destination: string) => {
    throw new Error(`NEXT_REDIRECT:${destination}`);
  }),
}));

import BookingReviewPage from "./page";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

const booking = {
  id: "bk_1",
  checkIn: new Date("2026-11-01T00:00:00.000Z"),
  checkOut: new Date("2026-12-01T00:00:00.000Z"),
  months: 1,
  guests: 1,
  total: 25_000,
  status: "PENDING",
  paymentStatus: "PENDING",
  hostel: {
    name: "Green View",
    slug: "green-view",
    city: "Lahore",
    area: null,
    coverImage: null,
  },
};

function context(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("booking review page", () => {
  it("loads a minimal booking DTO scoped to the signed-in student", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "student_1", role: "STUDENT" },
    } as never);
    vi.mocked(db.booking.findFirst).mockResolvedValue(booking as never);

    const page = await BookingReviewPage(context("bk_1"));

    expect(page).toBeTruthy();
    expect(db.booking.findFirst).toHaveBeenCalledWith({
      where: { id: "bk_1", userId: "student_1" },
      select: {
        id: true,
        checkIn: true,
        checkOut: true,
        months: true,
        guests: true,
        total: true,
        status: true,
        paymentStatus: true,
        hostel: {
          select: {
            name: true,
            slug: true,
            city: true,
            area: true,
            coverImage: true,
          },
        },
      },
    });
  });

  it("rejects an oversized booking ID before querying", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "student_1", role: "STUDENT" },
    } as never);

    await expect(BookingReviewPage(context("x".repeat(65)))).rejects.toThrow("NEXT_NOT_FOUND");

    expect(db.booking.findFirst).not.toHaveBeenCalled();
  });

  it("does not return a booking the current student does not own", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "student_2", role: "STUDENT" },
    } as never);
    vi.mocked(db.booking.findFirst).mockResolvedValue(null);

    await expect(BookingReviewPage(context("bk_1"))).rejects.toThrow("NEXT_NOT_FOUND");

    expect(db.booking.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "bk_1", userId: "student_2" } }),
    );
  });

  it("redirects anonymous visitors to login without querying", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(BookingReviewPage(context("bk_1"))).rejects.toThrow("NEXT_REDIRECT:/login");

    expect(db.booking.findFirst).not.toHaveBeenCalled();
  });
});
