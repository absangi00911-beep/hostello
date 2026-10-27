import { expect, test } from "@playwright/test";

const hostelResults = Array.from({ length: 10 }, (_, index) => ({
  id: `hostel-${index + 1}`,
  name: `Campus Stay ${index + 1}`,
  slug: `campus-stay-${index + 1}`,
  city: "Lahore",
  area: "Gulberg",
  pricePerMonth: 18_000 + index * 1_000,
  coverImage:
    "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80",
  images: [],
  rating: 4.5,
  reviewCount: 18,
}));

test.beforeEach(async ({ page }) => {
  await page.route("**/api/hostels**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: hostelResults,
        total: hostelResults.length,
        page: 1,
        limit: 20,
        hasMore: false,
        isSearchDegraded: false,
      }),
    }),
  );
});

test("search_results_use_a_two_column_listing_and_map_layout", async ({
  page,
}) => {
  await page.goto("/search?city=Lahore");

  const wordmark = page.getByRole("link", { name: "hostello home" });
  await expect(wordmark).toHaveText("hostello");
  await expect(wordmark).toHaveCSS("font-family", /Arial Rounded MT Bold/);
  await expect(wordmark.locator(".browse-brand-mark")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Hostels in Lahore" }),
  ).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Search destination" })).toHaveValue(
    "Lahore",
  );
  await expect(page.getByRole("region", { name: "Hostel listings" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Map preview" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Campus Stay 1", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("10 hostels in Lahore")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Listing pages" })).toBeVisible();
  await expect(page.getByText("Filters", { exact: true })).toBeVisible();
  await expect(page.getByText("Prices include monthly rent")).toBeVisible();
});

test("search_results_are_available_without_a_city_filter", async ({ page }) => {
  const searchRequest = page.waitForRequest((request) =>
    request.url().includes("/api/hostels?"),
  );

  await page.goto("/search");

  const request = await searchRequest;
  const params = new URL(request.url()).searchParams;
  expect(params.has("city")).toBe(false);
  expect(params.get("page")).toBe("1");
  await expect(
    page.getByRole("heading", { name: "Hostels across Pakistan" }),
  ).toBeVisible();
});

test("home_search_opens_the_results_page_for_the_entered_city", async ({
  page,
}) => {
  await page.goto("/");
  const wordmark = page.getByRole("link", { name: "hostello home" });
  await expect(wordmark).toHaveText("hostello");
  await expect(wordmark.locator(".browse-brand-mark")).toHaveCount(0);
  await page.getByRole("searchbox", { name: "Destination" }).fill("Lahore");
  await page.getByRole("button", { name: "Search hostels" }).click();

  await expect(page).toHaveURL(/\/search\?city=Lahore$/);
  await expect(
    page.getByRole("heading", { name: "Hostels in Lahore" }),
  ).toBeVisible();
});

test("search_results_fit_supported_viewports_without_horizontal_overflow", async ({
  page,
}) => {
  await page.goto("/search?city=Lahore");

  await expect(page.getByRole("region", { name: "Hostel listings" })).toBeVisible();

  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  const searchButtonTop = await page
    .locator(".search-compact-submit")
    .evaluate((button) => button.getBoundingClientRect().top);
  const searchFormTop = await page
    .locator(".search-compact-form")
    .evaluate((form) => form.getBoundingClientRect().top);
  expect(Math.abs(searchButtonTop - searchFormTop)).toBeLessThan(20);
});

test("search_reports_errors_when_hostel_results_cannot_be_loaded", async ({
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

  await page.goto("/search?city=Lahore");

  await expect(
    page.getByRole("alert").getByText("Search service unavailable."),
  ).toBeVisible();
});

test("search_shows_an_empty_state_when_no_hostels_match", async ({ page }) => {
  await page.unroute("**/api/hostels**");
  await page.route("**/api/hostels**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        hasMore: false,
        isSearchDegraded: false,
      }),
    }),
  );

  await page.goto("/search?city=Lahore");

  await expect(
    page.getByRole("status").getByText("No hostels found in Lahore yet."),
  ).toBeVisible();
});
