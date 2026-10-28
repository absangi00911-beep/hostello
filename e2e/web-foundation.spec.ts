import { expect, test } from "@playwright/test";

const hostelResults = Array.from({ length: 25 }, (_, index) => {
  const city = index < 10 ? "Lahore" : index < 20 ? "Murree" : "Karachi";

  return {
    id: `hostel-${index + 1}`,
    name: `${city} Student Stay ${index + 1}`,
    slug: `student-stay-${index + 1}`,
    city,
    area: index % 2 === 0 ? "Gulberg" : "Mall Road",
    pricePerMonth: index % 3 === 0 ? 15_000 : 24_000,
    gender: index === 0 || index === 10 ? "FEMALE" : "MIXED",
    coverImage:
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80",
    images: [],
    rating: 4.5,
    reviewCount: 18,
  };
});

test.beforeEach(async ({ page }) => {
  await page.route("**/api/hostels**", async (route) => {
    const params = new URL(route.request().url()).searchParams;
    const city = params.get("city");
    const gender = params.get("gender");
    const maxPrice = Number(params.get("maxPrice"));
    const data = hostelResults.filter(
      (hostel) =>
        (!city || hostel.city === city) &&
        (!gender || hostel.gender === gender) &&
        (!params.has("maxPrice") || hostel.pricePerMonth <= maxPrice),
    );

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data,
        total: data.length,
        page: 1,
        limit: 50,
        hasMore: false,
        isSearchDegraded: false,
      }),
    });
  });
});

test("home_starts_with_hostel_discovery_and_airbnb_inspired_search", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: "HostelLo home" })).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Browse categories" }),
  ).toBeVisible();
  await expect(
    page.getByRole("searchbox", { name: "Destination" }),
  ).toBeVisible();
  await expect(page.getByLabel("Move-in date")).toBeVisible();
  await expect(page.getByLabel("Guests")).toBeVisible();
  await expect(
    page.getByText(
      "Move-in date and guests aren't used to filter availability yet.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Stays in Lahore" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Stays in Murree" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Lahore Student Stay 1",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.locator(".hostel-carousel").first().locator("img").first(),
  ).toHaveAttribute("loading", "eager");
  await expect(
    page.locator(".hostel-carousel").first().locator("img").nth(9),
  ).toHaveAttribute("loading", "eager");
  await expect(
    page.locator(".hostel-carousel").nth(1).locator("img").first(),
  ).toHaveAttribute("loading", "eager");
  await expect(
    page.locator(".hostel-carousel").nth(2).locator("img").first(),
  ).toHaveAttribute("loading", "lazy");
  await expect(page.locator(".hero-section")).toHaveCount(0);
});

test("category_tabs_filter_by_supported_hostel_attributes", async ({
  page,
}) => {
  await page.goto("/");

  const womenOnly = page.getByRole("button", { name: "Women-only" });
  await womenOnly.click();

  await expect(womenOnly).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("heading", { name: "Lahore Student Stay 1" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Lahore Student Stay 2" }),
  ).toHaveCount(0);
});

test("destination_search_filters_hostels_without_claiming_date_or_guest_filters", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("searchbox", { name: "Destination" }).fill("Murree");
  await page.getByLabel("Move-in date").fill("2026-11-01");
  await page.getByLabel("Guests").selectOption("2");

  const searchRequest = page.waitForRequest((request) =>
    request.url().includes("/api/hostels?"),
  );
  await page.getByRole("button", { name: "Search hostels" }).click();
  const request = await searchRequest;
  const searchParams = new URL(request.url()).searchParams;

  expect(searchParams.get("city")).toBe("Murree");
  expect(searchParams.has("moveInDate")).toBe(false);
  expect(searchParams.has("guests")).toBe(false);
  await expect(
    page.getByRole("heading", { name: "Stays in Murree" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Stays in Lahore" }),
  ).toHaveCount(0);
});

test("hostel_carousel_peek_matches_desktop_tablet_and_mobile_direction", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const carousel = page.locator(".hostel-carousel").first();
  await expect(carousel).toBeVisible();
  const scrollBefore = await carousel.evaluate((element) => element.scrollLeft);
  await page.getByRole("button", { name: "Scroll Lahore listings right" }).click();
  await expect
    .poll(() => carousel.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(scrollBefore);

  for (const [width, expectedVisible] of [
    [1440, 8.5],
    [1024, 4.5],
    [800, 4.5],
    [390, 2.5],
    [320, 2.5],
  ]) {
    await page.setViewportSize({ width, height: 900 });
    const visibleCount = await carousel.evaluate((element) => {
      const card = element.querySelector(".hostel-card");
      if (!card) return 0;
      const gap = Number.parseFloat(getComputedStyle(element).columnGap);
      return (
        (element.clientWidth + gap) /
        (card.getBoundingClientRect().width + gap)
      );
    });

    expect(visibleCount).toBeCloseTo(expectedVisible, 1);
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
  }

  expect(
    await carousel.evaluate(
      (element) => element.scrollWidth > element.clientWidth,
    ),
  ).toBe(true);
});

test("hovering_a_hostel_card_does_not_animate_its_image", async ({ page }) => {
  await page.goto("/");

  const card = page.locator(".hostel-card").first();
  const image = card.locator(".hostel-card-photo");
  await card.hover();

  await expect(image).toHaveCSS("transform", "none");
  await expect(image).toHaveCSS("transition-duration", "0s");
});

test("home_exposes_api_errors_instead_of_empty_success_content", async ({
  page,
}) => {
  await page.unroute("**/api/hostels**");
  await page.route("**/api/hostels**", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Search service unavailable." }),
    }),
  );
  await page.goto("/");

  await expect(
    page.getByRole("alert").getByText("Search service unavailable."),
  ).toBeVisible();
});

test("home_explains_when_no_active_hostels_are_listed", async ({ page }) => {
  await page.unroute("**/api/hostels**");
  await page.route("**/api/hostels**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [], total: 0 }),
    }),
  );
  await page.goto("/");

  await expect(
    page.getByRole("status").getByText("No active hostel listings yet."),
  ).toBeVisible();
});

test("tailwind_foundation_preserves_global_body_styles", async ({ page }) => {
  await page.goto("/");

  const body = page.locator("body");
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });

    await expect(body).toHaveClass(/min-h-screen/);
    await expect(body).toHaveClass(/bg-canvas/);
    await expect(body).toHaveClass(/text-ink/);
    await expect(body).toHaveCSS("min-height", `${height}px`);

    const bodyColors = await body.evaluate((element) => {
      const probe = document.createElement("div");
      probe.style.backgroundColor = "var(--canvas)";
      probe.style.color = "var(--ink)";
      document.body.append(probe);

      const actual = getComputedStyle(element);
      const expected = getComputedStyle(probe);
      const colors = {
        background: actual.backgroundColor,
        expectedBackground: expected.backgroundColor,
        color: actual.color,
        expectedColor: expected.color,
      };

      probe.remove();
      return colors;
    });

    expect(bodyColors.background).toBe(bodyColors.expectedBackground);
    expect(bodyColors.color).toBe(bodyColors.expectedColor);
  }
});
