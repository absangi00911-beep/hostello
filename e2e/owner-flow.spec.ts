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

  test("owner confirms a pending booking and status updates to Confirmed", async ({ ownerPage: page }) => {
    await page.goto("/owner/bookings");

    // Wait for the Confirm button to appear (table has loaded)
    const confirmBtn = page.getByRole("button", { name: /^confirm$/i }).first();
    await expect(confirmBtn).toBeVisible({ timeout: 10_000 });

    await confirmBtn.click();

    // The button disappears and is replaced by the "Confirmed" text label
    // React Query invalidates and re-fetches after the mutation settles
    await expect(confirmBtn).not.toBeVisible({ timeout: 10_000 });

    // Status cell now shows "Confirmed" (rendered by StatusBadge)
    await expect(
      page.getByText(/confirmed/i).first(),
    ).toBeVisible({ timeout: 8_000 });

    // Decline button should also be gone — row is no longer actionable
    await expect(
      page.getByRole("button", { name: /^decline$/i }),
    ).not.toBeVisible();
  });

  test("student dashboard reflects the confirmed status", async ({ studentPage: page }) => {
    await page.goto("/dashboard/bookings");

    // Wait for the booking list to render
    await page.waitForLoadState("networkidle");

    // The status badge for the confirmed booking should read "Confirmed"
    // Filter to CONFIRMED tab to narrow the assertion
    const confirmedTab = page
      .getByRole("button", { name: /confirmed/i })
      .or(page.getByRole("tab", { name: /confirmed/i }))
      .first();

    // Tab may or may not exist depending on UI variant — try clicking it if present
    const tabVisible = await confirmedTab.isVisible().catch(() => false);
    if (tabVisible) await confirmedTab.click();

    // Either way, at least one "Confirmed" status badge must be on the page
    await expect(
      page.getByText(/confirmed/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

});
