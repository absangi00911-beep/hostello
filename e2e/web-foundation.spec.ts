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
    const requestUrl = new URL(route.request().url());
    if (requestUrl.pathname.endsWith("/nearby")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: hostelResults,
          total: hostelResults.length,
          page: 1,
          limit: 20,
          hasMore: true,
          isSearchDegraded: false,
        }),
      });
      return;
    }

    const params = requestUrl.searchParams;
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
  const response = await page.goto("/");
  expect(response?.headers()["permissions-policy"]).toContain(
    "geolocation=(self)",
  );

  await expect(page.getByRole("link", { name: "hostello home" })).toBeVisible();
  await expect(page.locator("header")).not.toHaveClass(/border-b/);
  await expect(page.locator("header > div")).toHaveClass(/min-h-20/);
  await expect(
    page.getByRole("navigation", { name: "Browse categories" }),
  ).toBeVisible();
  await expect(
    page.getByRole("searchbox", { name: "Destination" }),
  ).toBeVisible();
  const desktopSearch = page.locator(
    'section[aria-label="Search stays"] form[role="search"]:visible',
  );
  await expect(
    desktopSearch.getByRole("button", { name: "Move-in date" }),
  ).toBeVisible();
  await expect(
    desktopSearch.getByRole("button", { name: "Guests" }),
  ).toBeVisible();
  await expect(
    page
      .locator('section[aria-label="Search stays"] > div > p')
      .getByText("Availability is checked only on the selected move-in date."),
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

test("destination_and_move_in_date_filters_apply_to_search_results", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("searchbox", { name: "Destination" }).fill("Murree");
  const desktopSearch = page.locator(
    'section[aria-label="Search stays"] form[role="search"]:visible',
  );
  await desktopSearch.getByRole("button", { name: /^Murree, Pakistan/ }).click();
  const dateButton = desktopSearch
    .locator('button[aria-pressed]:not(:disabled)')
    .first();
  const dateLabel = await dateButton.getAttribute("aria-label");
  const selectedDate = new Date(dateLabel ?? "");
  const moveInDate = [
    selectedDate.getFullYear(),
    String(selectedDate.getMonth() + 1).padStart(2, "0"),
    String(selectedDate.getDate()).padStart(2, "0"),
  ].join("-");
  await dateButton.click();
  await desktopSearch.getByRole("button", { name: "Guests" }).click();
  await desktopSearch.getByRole("button", { name: "Increase students" }).click();

  const searchRequest = page.waitForRequest((request) =>
    request.url().includes("/api/hostels?") &&
    new URL(request.url()).searchParams.has("moveInDate"),
  );
  await page.getByRole("button", { name: "Search hostels" }).click();
  const request = await searchRequest;
  const searchParams = new URL(request.url()).searchParams;

  expect(searchParams.get("city")).toBe("Murree");
  expect(searchParams.get("moveInDate")).toBe(moveInDate);
  expect(searchParams.get("guests")).toBe("2");
  await expect(
    page.getByRole("heading", { name: "Hostels in Murree" }),
  ).toBeVisible();
  await expect(page).toHaveURL(new RegExp(
    `/search\\?city=Murree&moveInDate=${moveInDate}&guests=2$`,
  ));
  await expect(
    page.getByRole("heading", { name: "Stays in Lahore" }),
  ).toHaveCount(0);
});

test("destination_suggestions_filter_and_clear", async ({ page }) => {
  await page.goto("/");
  const search = page.locator(
    'section[aria-label="Search stays"] form[role="search"]:visible',
  );
  const destination = page.getByRole("searchbox", { name: "Destination" });

  await destination.fill("murr");
  await expect(search.getByRole("button", { name: /^Murree, Pakistan/ }))
    .toBeVisible();
  await expect(search.getByRole("button", { name: /^Lahore, Pakistan/ }))
    .toHaveCount(0);

  await search.getByRole("button", { name: "Clear destination" }).click();
  await expect(destination).toHaveValue("");
  await expect(search.getByRole("button", { name: /^Lahore, Pakistan/ }))
    .toBeVisible();
});

test("student_count_picker_is_clamped_from_one_to_eight", async ({ page }) => {
  await page.goto("/");
  const search = page.locator(
    'section[aria-label="Search stays"] form[role="search"]:visible',
  );
  await search.getByRole("button", { name: "Guests" }).click();

  const picker = search.getByRole("dialog", { name: "Choose students" });
  const decrease = picker.getByRole("button", { name: "Decrease students" });
  const increase = picker.getByRole("button", { name: "Increase students" });
  await expect(picker.getByText("Looking for a monthly stay")).toBeVisible();
  await expect(decrease).toBeDisabled();
  for (let count = 1; count < 8; count += 1) {
    await increase.click();
  }
  await expect(picker.getByText("8", { exact: true })).toBeVisible();
  await expect(increase).toBeDisabled();
  await decrease.click();
  await expect(picker.getByText("7", { exact: true })).toBeVisible();
});

test("flexible_dates_pick_a_month_then_one_exact_move_in_day", async ({ page }) => {
  await page.goto("/");
  const search = page.locator(
    'section[aria-label="Search stays"] form[role="search"]:visible',
  );

  await search.getByRole("button", { name: "Move-in date" }).click();
  await search.getByRole("tab", { name: "Flexible" }).click();
  await search.getByRole("button", { name: /\w+ \d{4}/ }).nth(1).click();

  await expect(
    search.getByText(/Choose a move-in day in/),
  ).toBeVisible();
  const day = search
    .locator('button[aria-pressed]:not(:disabled)')
    .first();
  await expect(day).toBeVisible();
  await day.click();
  await expect(search.getByRole("button", { name: "Move-in date" })).not.toHaveText(
    "Add a date",
  );
});

test("nearby_requests_location_on_selection_and_keeps_coordinates_out_of_the_url", async ({
  page,
}) => {
  await page.context().grantPermissions(["geolocation"]);
  await page.context().setGeolocation({
    latitude: 33.6844,
    longitude: 73.0479,
  });
  await page.goto("/");

  const search = page.locator(
    'section[aria-label="Search stays"] form[role="search"]:visible',
  );
  await page.getByRole("searchbox", { name: "Destination" }).click();
  await search.getByRole("button", { name: "Nearby", exact: true }).click();
  await expect(search.getByText(/your location within 25 km/i)).toBeVisible();
  await expect(search.getByRole("tab", { name: "Dates" })).toBeVisible();

  const nearbyRequest = page.waitForRequest((request) =>
    request.url().includes("/api/hostels/nearby"),
  );
  await page.getByRole("button", { name: "Search hostels" }).click();
  const request = await nearbyRequest;
  const body = request.postDataJSON() as {
    latitude: number;
    longitude: number;
  };

  expect(request.method()).toBe("POST");
  expect(body).toMatchObject({ latitude: 33.6844, longitude: 73.0479 });
  await expect(page).toHaveURL(/\/search\?nearby=true$/);
  await expect(
    page.getByRole("heading", { name: "Hostels near you" }),
  ).toBeVisible();
  expect(page.url()).not.toContain("33.6844");
  expect(page.url()).not.toContain("73.0479");
});

test("nearby_permission_denial_explains_the_city_fallback", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (
          _success: unknown,
          error: (reason: { code: number; message: string }) => void,
        ) => error({ code: 1, message: "Permission denied" }),
      },
    });
  });
  await page.goto("/");

  const search = page.locator(
    'section[aria-label="Search stays"] form[role="search"]:visible',
  );
  await page.getByRole("searchbox", { name: "Destination" }).click();
  await search.getByRole("button", { name: "Nearby", exact: true }).click();
  await expect(search.getByRole("alert")).toHaveText(
    "Location access was denied. Choose a city to search instead.",
  );

  await search.getByRole("button", { name: "Choose a city" }).click();
  await expect(search.getByRole("button", { name: "Lahore", exact: true }))
    .toBeVisible();
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
    [1440, 7.15],
    [1024, 4.15],
    [800, 4.15],
    [390, 2.15],
    [320, 2.15],
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

    expect(Math.abs(visibleCount - expectedVisible)).toBeLessThanOrEqual(0.1);
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

test("hovering_a_hostel_card_brightens_its_image_without_zooming", async ({
  page,
}) => {
  await page.goto("/");

  const card = page.locator(".hostel-card").first();
  const image = card.locator(".hostel-card-photo");
  await card.hover();

  await expect(image).toHaveCSS("filter", "brightness(0.9)");
  await expect(image).toHaveCSS("transform", "none");
});

test("hostel_favorite_control_keeps_its_transparent_seven_pixel_inset", async ({
  page,
}) => {
  await page.goto("/");

  const favorite = page.locator(".hostel-favorite-button").first();
  await expect(favorite).toHaveCSS("top", "7px");
  await expect(favorite).toHaveCSS("right", "7px");
  await expect(favorite).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(favorite).toHaveCSS("filter", "brightness(0.95)");
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

test("login_dialog_uses_tailwind_styles_and_fits_desktop_and_mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/login?error=expired-token");

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveClass(/fixed/);
  await expect(dialog).toHaveCSS("position", "fixed");
  await expect(dialog).toHaveCSS("border-radius", "20px");
  const emailInput = page.getByLabel("Email");
  await expect(emailInput).toBeFocused();
  await expect(page.getByRole("alert")).toHaveClass(/bg-surface-muted/);
  await expect(dialog.locator('button[type="submit"]')).toHaveCSS(
    "min-height",
    "50px",
  );
  await emailInput.press("Tab");
  await expect(dialog.getByRole("button", { name: "Continue" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(emailInput).toBeFocused();
  await expect(emailInput).toHaveCSS("border-color", "rgb(37, 99, 235)");
  await expect(emailInput).toHaveCSS("outline-color", "rgb(37, 99, 235)");

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(dialog).toHaveCSS("width", "358px");
  await expect(dialog).toHaveCSS("padding", "30px 22px 24px");
});

test("browse_shell_preserves_consistent_gutters_at_all_breakpoints", async ({
  page,
}) => {
  await page.goto("/");

  const home = page.locator(".browse-home");
  const shell = page.locator(".browse-shell");
  const search = page.locator(
    'section[aria-label="Search stays"] form[role="search"]',
  );
  const desktopCategories = page.locator("header .browse-category-nav");
  await expect(home).toHaveClass(/min-h-dvh/);
  await expect(shell).toHaveClass(/mx-auto/);

  for (const [width, height, expectedGutter, expectedSearchWidth] of [
    [1440, 900, 32, "800px"],
    [800, 900, 16, "640px"],
    [390, 844, 20, null],
  ]) {
    await page.setViewportSize({ width, height });
    await expect
      .poll(() => shell.evaluate((element) => element.getBoundingClientRect().x))
      .toBe(expectedGutter);
    if (expectedSearchWidth) {
      await expect(search).toHaveCSS("width", expectedSearchWidth);
      await expect(desktopCategories).toHaveCSS("height", "80px");
    } else {
      await expect(search).toBeHidden();
    }
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
  }
});

test("mobile_search_dialog_keeps_responsive_layout_and_keyboard_focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const trigger = page.getByRole("button", { name: "Start your search" });
  await expect(trigger).toBeVisible();
  await expect(
    page.locator('section[aria-label="Search stays"] form[role="search"]'),
  ).toBeHidden();

  await page.keyboard.press("Tab");
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveCSS("outline-width", "2px");
  await expect(trigger).toHaveCSS("outline-offset", "3px");
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog", { name: "Search stays" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveClass(/h-dvh/);
  await expect(dialog).toHaveCSS("position", "fixed");
  await expect(dialog).toHaveCSS("height", "844px");
  await expect(dialog.getByRole("searchbox", { name: "Destination" })).toBeVisible();

  await dialog.getByRole("button", { name: "Close search" }).click();
  await expect(dialog).toBeHidden();
});

test("browse_search_controls_respect_reduced_motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const submit = page.locator(
    'section[aria-label="Search stays"] form[role="search"] button[type="submit"]',
  );
  await submit.hover();
  await expect(submit).toHaveCSS("transform", "none");
});
