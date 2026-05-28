// e2e/booking-flow.spec.ts
//
// Full student journey: login → browse hostels → open hostel detail →
// fill booking form → reach payment step → verify booking appears in dashboard.
//
// Uses the pre-seeded test hostel created by global.setup.ts.
// Payment is NOT completed (Safepay is a third-party hosted page) — the test
// asserts the booking record exists in PENDING state on the dashboard, which
// is sufficient to verify the full web app flow up to the payment redirect.

import { test, expect } from "./fixtures/auth";

test.describe("Student booking flow", () => {

  test("student can log in and reach their dashboard", async ({ studentPage: page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
    // Dashboard renders a heading or nav that identifies the authenticated user
    await expect(
      page.getByRole("heading", { name: /dashboard|my bookings|overview/i }).first(),
    ).toBeVisible({ timeout: 8_000 });
  });

  test("search page loads and displays the seeded hostel", async ({ studentPage: page, state }) => {
    await page.goto("/hostels?city=Islamabad");

    // At least one hostel card should be visible
    const hostelCard = page
      .getByRole("link", { name: new RegExp(state.hostel.name, "i") })
      .first();
    await expect(hostelCard).toBeVisible({ timeout: 10_000 });
  });

  test("hostel detail page loads from search result", async ({ studentPage: page, state }) => {
    await page.goto(`/hostels/${state.hostel.slug}`);

    // Hostel name appears as a heading
    await expect(
      page.getByRole("heading", { name: new RegExp(state.hostel.name, "i") }),
    ).toBeVisible({ timeout: 8_000 });

    // Booking panel is visible (desktop — sticky aside with aria-label)
    await expect(page.getByRole("complementary", { name: "Booking panel" })).toBeVisible();
  });

  test("booking form can be filled and submitted", async ({ studentPage: page, state }) => {
    await page.goto(`/hostels/${state.hostel.slug}`);

    // Wait for the booking panel to mount
    const panel = page.getByRole("complementary", { name: "Booking panel" });
    await expect(panel).toBeVisible({ timeout: 8_000 });

    // Fill in dates — tomorrow as check-in, two months later as check-out
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const checkOut = new Date(tomorrow);
    checkOut.setMonth(checkOut.getMonth() + 2);

    const fmt = (d: Date) => d.toISOString().split("T")[0]; // YYYY-MM-DD

    await page.locator("#check-in").fill(fmt(tomorrow));
    await page.locator("#check-out").fill(fmt(checkOut));
    await page.locator("#guests").fill("1");

    // Submit the form — "Request booking" is the submit button label
    await page.getByRole("button", { name: /request booking/i }).click();

    // Should redirect to the booking review page /booking/<id>/review
    await expect(page).toHaveURL(/\/booking\/.+\/review/, { timeout: 15_000 });

    // Review page shows "Review your booking" heading
    await expect(
      page.getByRole("heading", { name: /review your booking/i }),
    ).toBeVisible();
  });

  test("review page shows correct summary and links to payment", async ({ studentPage: page, state }) => {
    // Re-navigate to the hostel and create a fresh booking (each test is isolated)
    await page.goto(`/hostels/${state.hostel.slug}`);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const checkOut = new Date(tomorrow);
    checkOut.setMonth(checkOut.getMonth() + 1);
    const fmt = (d: Date) => d.toISOString().split("T")[0];

    await page.locator("#check-in").fill(fmt(tomorrow));
    await page.locator("#check-out").fill(fmt(checkOut));
    await page.getByRole("button", { name: /request booking/i }).click();
    await expect(page).toHaveURL(/\/booking\/.+\/review/, { timeout: 15_000 });

    // The hostel name should appear in the summary card
    await expect(
      page.getByText(new RegExp(state.hostel.name, "i")),
    ).toBeVisible();

    // "Confirm and pay" CTA links to /booking/<id>/payment
    const ctaLink = page.getByRole("link", { name: /confirm and pay/i });
    await expect(ctaLink).toBeVisible();
    const href = await ctaLink.getAttribute("href");
    expect(href).toMatch(/\/booking\/.+\/payment/);
  });

  test("booking appears on dashboard in PENDING state", async ({ studentPage: page, state }) => {
    // Create a booking
    await page.goto(`/hostels/${state.hostel.slug}`);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const checkOut = new Date(tomorrow);
    checkOut.setMonth(checkOut.getMonth() + 1);
    const fmt = (d: Date) => d.toISOString().split("T")[0];

    await page.locator("#check-in").fill(fmt(tomorrow));
    await page.locator("#check-out").fill(fmt(checkOut));
    await page.getByRole("button", { name: /request booking/i }).click();
    await expect(page).toHaveURL(/\/booking\/.+\/review/, { timeout: 15_000 });

    // Navigate to dashboard bookings tab
    await page.goto("/dashboard/bookings");
    await expect(page).toHaveURL(/\/dashboard\/bookings/);

    // The seeded hostel's name should appear on a booking card
    await expect(
      page.getByText(new RegExp(state.hostel.name, "i")).first(),
    ).toBeVisible({ timeout: 10_000 });

    // Status badge should show "Pending" (case-insensitive)
    await expect(
      page.getByText(/pending/i).first(),
    ).toBeVisible();
  });

});
