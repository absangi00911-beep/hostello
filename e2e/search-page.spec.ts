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

  const firstResult = page.locator(".search-result-card").first();
  const firstImage = firstResult.locator(".hostel-card-photo");
  await expect(firstImage).toHaveClass(/group-hover:brightness-\[0\.9\]/);
  await firstResult.hover();
  await expect(firstImage).toHaveCSS("filter", "brightness(0.9)");
  await expect(firstImage).toHaveCSS("transform", "none");
});

test("search_results_keep_the_tailwind_layout_at_desktop_tablet_and_mobile_widths", async ({
  page,
}) => {
  await page.goto("/search?city=Lahore");

  const pageClass = await page.locator(".search-results-page").getAttribute("class");
  const headerClass = await page.locator(".search-results-header").getAttribute("class");
  const mainClass = await page.locator(".search-results-main").getAttribute("class");
  const hostLink = page.locator(".browse-host-link");

  expect(pageClass).toContain("min-h-dvh");
  expect(headerClass).toContain("sticky");
  expect(headerClass).toContain("backdrop-blur-[12px]");
  expect(mainClass).toContain("w-[min(1920px,calc(100%-64px))]");

  for (const [width, expectedGutter, expectedMapDisplay] of [
    [1440, 32, "block"],
    [800, 16, "block"],
    [768, 16, "none"],
    [390, 20, "none"],
  ] as const) {
    await page.setViewportSize({
      width,
      height: width === 390 ? 844 : 900,
    });

    const layout = await page.evaluate(() => {
      const main = document.querySelector(".search-results-main");
      const map = document.querySelector(".search-map-preview");
      const filters = document.querySelector(".search-filter-list");
      if (!main || !map || !filters) {
        throw new Error("Search layout elements are missing");
      }

      return {
        gutter: Math.round(main.getBoundingClientRect().left),
        mapDisplay: getComputedStyle(map).display,
        filterOverflow: getComputedStyle(filters).overflowX,
        documentWidth: document.documentElement.scrollWidth,
      };
    });

    expect(layout.gutter).toBe(expectedGutter);
    expect(layout.mapDisplay).toBe(expectedMapDisplay);
    expect(layout.filterOverflow).toBe("auto");
    expect(layout.documentWidth).toBeLessThanOrEqual(width);
    if (width === 1440) {
      await expect(hostLink).toBeVisible();
    } else if (width === 800) {
      await expect(hostLink).toBeHidden();
    }
  }

  await page.setViewportSize({ width: 390, height: 844 });
  const resultColumnCount = await page
    .locator(".search-result-grid")
    .evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(" ").length);
  expect(resultColumnCount).toBe(1);
  const filtersCanScroll = await page
    .locator(".search-filter-list")
    .evaluate((filters) => filters.scrollWidth > filters.clientWidth);
  expect(filtersCanScroll).toBe(true);

  const currentPage = page.getByRole("button", { name: "Page 1" });
  await expect(currentPage).toHaveAttribute("aria-current", "page");
  await expect(currentPage).toHaveCSS("background-color", "rgb(15, 23, 42)");
  await expect(
    page.getByRole("button", { name: "Previous page" }),
  ).toHaveCSS("color", "rgb(160, 169, 162)");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(currentPage).toHaveCSS("scroll-behavior", "auto");
  await expect(currentPage).toHaveCSS("transition-duration", "0s");
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
