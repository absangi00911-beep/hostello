// e2e/owner-flow.spec.ts
//
// Owner journey: login → view pending booking → confirm it →
// assert CONFIRMED status on owner view → assert CONFIRMED on student dashboard.
//
// Creates its own PENDING booking in beforeAll via direct DB insert so it
// doesn't depend on booking-flow.spec.ts having run first.  Cleans up
// in afterAll so no orphan records are left.

import { test, expect, loadState } from "./fixtures/auth";
import type { PrismaClient } from "@prisma/client";
import { createE2EDb } from "./db";

let db: PrismaClient;
let testBookingId: string;

test.beforeAll(async () => {
  db = createE2EDb();
  const state = await loadState();

  // Fetch the room created by global.setup so we have an ID to attach
  const room = await db.room.findFirst({
    where: { hostelId: state.hostel.id },
    select: { id: true, pricePerMonth: true },
  });

  if (!room) throw new Error("[owner-flow] No room found on test hostel. Did global.setup run?");

  const checkIn  = new Date();
  checkIn.setDate(checkIn.getDate() + 7);
  const checkOut = new Date(checkIn);
  checkOut.setMonth(checkOut.getMonth() + 1);

  const booking = await db.booking.create({
    data: {
      hostelId:      state.hostel.id,
      roomId:        room.id,
      userId:        state.student.id,
      checkIn,
      checkOut,
      months:        1,
      guests:        1,
      total:         room.pricePerMonth,
      status:        "PENDING",
      paymentStatus: "PENDING",
      paymentMethod: "safepay",
    },
  });

  testBookingId = booking.id;
});

test.afterAll(async () => {
  if (testBookingId) {
    await db.booking.deleteMany({ where: { id: testBookingId } });
  }
  await db.$disconnect();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe("Owner booking confirmation flow", () => {

  test("owner can reach the bookings management page", async ({ ownerPage: page }) => {
    await page.goto("/owner/bookings");
    await expect(page).toHaveURL(/\/owner\/bookings/);
    // Table or empty state should be visible
    const bookingsTable = page.getByRole("table", { name: "Bookings" });
    const emptyState    = page.getByText(/no bookings/i);
    await expect(bookingsTable.or(emptyState)).toBeVisible({ timeout: 10_000 });
  });

  test("pending booking is visible in the owner bookings table", async ({ ownerPage: page, state }) => {
    await page.goto("/owner/bookings");

    // The hostel name appears in the booking row
    await expect(
      page.getByRole("table", { name: "Bookings" })
         .getByText(new RegExp(state.hostel.name, "i"))
         .first(),
    ).toBeVisible({ timeout: 10_000 });

    // A Confirm button is present for the pending booking
    await expect(
      page.getByRole("button", { name: /confirm/i }).first(),
    ).toBeVisible();
  });

  test("owner confirms a pending booking and status updates to Confirmed", async ({ ownerPage: page, state }) => {
    await page.goto("/owner/bookings");

    // Wait for the Confirm button to appear (table has loaded)
    const bookingRow = page
      .getByRole("row")
      .filter({ hasText: new RegExp(state.hostel.name, "i") })
      .first();
    const confirmBtn = bookingRow.getByRole("button", { name: /^confirm$/i });
    await expect(confirmBtn).toBeVisible({ timeout: 10_000 });

    const responsePromise = page.waitForResponse((response) =>
      response.request().method() === "PATCH" &&
      new URL(response.url()).pathname.startsWith("/api/bookings/"),
    );
    await confirmBtn.click();
    const response = await responsePromise;
    expect(response.status()).toBe(200);

    // Scope to this booking's status cell so the hidden filter option cannot match.
    await expect(bookingRow.getByRole("cell").nth(4).getByText("Confirmed", { exact: true }))
      .toBeVisible({ timeout: 10_000 });

    // This booking's row is no longer actionable; other pending rows may remain.
    await expect(
      bookingRow.getByRole("button", { name: /^decline$/i }),
    ).not.toBeVisible();
  });

  test("student dashboard reflects the confirmed status", async ({ studentPage: page }) => {
    const bookingsResponse = page.waitForResponse((response) =>
      response.request().method() === "GET" && new URL(response.url()).pathname === "/api/bookings",
    );
    await page.goto("/dashboard/bookings", { waitUntil: "domcontentloaded" });
    const response = await bookingsResponse;
    expect(response.ok()).toBeTruthy();

    const payload = await response.json() as {
      data?: Array<{ id: string; status: string; hostel?: { name?: string } }>;
    };
    const booking = payload.data?.find((item) => item.id === testBookingId);
    expect(booking?.status).toBe("CONFIRMED");
    await expect(page.getByText("Confirmed", { exact: true })).toBeVisible({ timeout: 10_000 });
  });

});
