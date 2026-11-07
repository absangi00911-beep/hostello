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
  await expect(wordmark.getByRole("img", { name: "Hostello logo" })).toBeVisible();
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
  expect(mainClass).toContain(
    "w-[min(1920px,calc(100%-var(--page-gutter-total)))]",
  );

  for (const [width, expectedGutter, expectedMapDisplay] of [
    [1440, 64, "block"],
    [800, 32, "block"],
    [768, 32, "none"],
    [390, 20, "none"],
  ] as const) {
    await page.setViewportSize({
      width,
      height: width === 390 ? 844 : 900,
    });

    const layout = await page.evaluate(() => {
      const main = document.querySelector(".search-results-main");
      const map = document.querySelector(".search-map-preview");
      if (!main || !map) {
        throw new Error("Search layout elements are missing");
      }

      return {
        gutter: Math.round(main.getBoundingClientRect().left),
        mapDisplay: getComputedStyle(map).display,
        documentWidth: document.documentElement.scrollWidth,
      };
    });

    expect(layout.gutter).toBe(expectedGutter);
    expect(layout.mapDisplay).toBe(expectedMapDisplay);
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

test("supported filters and pagination are reflected in the search request and URL", async ({
  page,
}) => {
  const requests: URL[] = [];
  await page.route("**/api/hostels**", async (route) => {
    const url = new URL(route.request().url());
    requests.push(url);
    const currentPage = Number(url.searchParams.get("page") ?? 1);
    const data = Array.from({ length: 20 }, (_, index) => ({
      id: `filtered-hostel-${currentPage}-${index + 1}`,
      name: `Filtered hostel ${currentPage}-${index + 1}`,
      slug: `filtered-hostel-${currentPage}-${index + 1}`,
      city: "Lahore",
      area: "Gulberg",
      pricePerMonth: 18_000,
      coverImage: null,
      images: [],
      rating: 4.5,
      reviewCount: 18,
    }));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data,
        total: 45,
        page: currentPage,
        limit: 20,
        hasMore: currentPage < 3,
      }),
    });
  });

  await page.goto("/search?city=Lahore");
  await page.getByText("Filters", { exact: true }).click();
  await page.getByLabel("Hostel type").selectOption("FEMALE");
  await page.getByLabel("Sort by").selectOption("price_asc");
  await page.getByLabel("Minimum monthly price (PKR)").fill("8000");
  await page.getByLabel("Maximum monthly price (PKR)").fill("24000");
  await page.getByLabel("Wi-Fi").check();
  await page.getByRole("button", { name: "Apply filters" }).click();

  await expect.poll(() =>
    requests.some((url) =>
      url.searchParams.get("gender") === "FEMALE" &&
      url.searchParams.get("minPrice") === "8000" &&
      url.searchParams.get("maxPrice") === "24000" &&
      url.searchParams.get("amenities") === "wifi" &&
      url.searchParams.get("sort") === "price_asc",
    ),
  ).toBe(true);
  await expect(page).toHaveURL(/gender=FEMALE/);
  await expect(page.getByRole("button", { name: "Remove Women only filter" })).toBeVisible();

  await page.getByRole("button", { name: "Page 2" }).click();
  await expect.poll(() =>
    requests.some((url) =>
      url.searchParams.get("page") === "2" &&
      url.searchParams.get("gender") === "FEMALE" &&
      url.searchParams.get("amenities") === "wifi",
    ),
  ).toBe(true);
  await expect(page).toHaveURL(/page=2/);
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
  await expect(page.getByRole("button", { name: "Edit search" })).toBeVisible();
  await expect(page.locator(".search-compact-form")).toBeHidden();
  await page.getByRole("button", { name: "Edit search" }).click();
  await expect(page.locator(".search-compact-submit")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
});

test("search_on_phones_opens_a_full_screen_sheet_from_a_summary_bar", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/search?city=Lahore");

  const summary = page.getByRole("button", { name: "Edit search" });
  await expect(summary).toContainText("Lahore");
  await expect(summary).toContainText("Any dates");
  await expect(page.locator(".search-compact-form")).toBeHidden();

  await summary.click();
  const form = page.locator(".search-compact-form");
  await expect(form).toBeVisible();
  const box = await form.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(389);
  expect(box?.height).toBeGreaterThanOrEqual(843);
  await expect(page.getByLabel("Search destination")).toBeVisible();
  await expect(page.getByLabel("Check-in date")).toBeVisible();
  await expect(page.getByLabel("Check-out date")).toBeVisible();
  await expect(page.getByLabel("Guests", { exact: true })).toBeVisible();

  await expect(page.getByLabel("Search destination")).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(form).toBeHidden();
  await expect(summary).toBeFocused();

  await summary.click();
  await page.getByLabel("Search destination").fill("Murree");
  await form.getByRole("button", { name: "Search hostels" }).click();
  await expect(page).toHaveURL(/city=Murree/);
  await expect(form).toBeHidden();
  await expect(summary).toContainText("Murree");
});

test("search_sheet_controls_use_16px_text_and_44px_targets_on_phones", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/search?city=Lahore");

  const summary = page.getByRole("button", { name: "Edit search" });
  expect((await summary.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  await summary.click();

  const form = page.locator(".search-compact-form");
  for (const label of [
    "Search destination",
    "Check-in date",
    "Check-out date",
  ]) {
    await expect(page.getByLabel(label)).toHaveCSS("font-size", "16px");
  }
  await expect(page.getByLabel("Guests", { exact: true })).toHaveCSS(
    "font-size",
    "16px",
  );
  for (const name of ["Close search", "Search hostels"]) {
    const box = await form.getByRole("button", { name }).boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.width).toBeGreaterThanOrEqual(44);
  }
});

test("search_header_scrolls_away_on_phones_but_stays_pinned_on_desktop", async ({
  page,
}) => {
  await page.goto("/search?city=Lahore");
  const header = page.locator(".search-results-header");
  const filters = page.locator(".search-filter-bar");

  await page.setViewportSize({ width: 1024, height: 800 });
  await expect(header).toHaveCSS("position", "sticky");

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(header).toHaveCSS("position", "static");
  await expect(filters).toHaveCSS("position", "sticky");
  await expect(filters).toHaveCSS("top", "0px");
});

test("open_filter_panel_scrolls_inside_the_pinned_bar_on_short_phones", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 600 });
  await page.goto("/search?city=Lahore");
  await page.getByText("Filters", { exact: true }).click();

  const panel = page.getByRole("form", { name: "Hostel filters" });
  await expect(panel).toBeVisible();
  const { clientHeight, scrollHeight } = await panel.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
  }));
  expect(clientHeight).toBeLessThan(600);
  expect(scrollHeight).toBeGreaterThanOrEqual(clientHeight);
  await expect(panel).toHaveCSS("overflow-y", "auto");
});

test("pages_declare_viewport_fit_cover_so_safe_area_insets_work", async ({
  page,
}) => {
  await page.goto("/search?city=Lahore");
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
    "content",
    /viewport-fit=cover/,
  );
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
