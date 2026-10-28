import { expect, test } from "@playwright/test";

const hostels = [
  {
    id: "hostel-lahore-1",
    slug: "lahore-student-stay-1",
    name: "Lahore Student Stay 1",
    city: "Lahore",
    area: "Gulberg",
    pricePerMonth: 18_000,
    gender: "FEMALE",
    coverImage: null,
    images: [],
    rating: 4.7,
    reviewCount: 12,
  },
  {
    id: "hostel-lahore-2",
    slug: "lahore-student-stay-2",
    name: "Lahore Student Stay 2",
    city: "Lahore",
    area: "Model Town",
    pricePerMonth: 24_000,
    gender: "MIXED",
    coverImage: null,
    images: [],
    rating: 4.2,
    reviewCount: 8,
  },
  {
    id: "hostel-murree-1",
    slug: "murree-student-stay-1",
    name: "Murree Student Stay",
    city: "Murree",
    area: "Mall Road",
    pricePerMonth: 19_000,
    gender: "MIXED",
    coverImage: null,
    images: [],
    rating: 4.5,
    reviewCount: 5,
  },
];

test.beforeEach(async ({ page }) => {
  await page.route("**/api/hostels**", async (route) => {
    const params = new URL(route.request().url()).searchParams;
    const city = params.get("city");
    const gender = params.get("gender");
    const maxPrice = Number(params.get("maxPrice"));
    const data = hostels.filter(
      (hostel) =>
        (!city || hostel.city.toLowerCase() === city.toLowerCase()) &&
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

test("mobile_explore_opens_search_and_submits_only_the_supported_destination", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  await expect(
    page.getByRole("button", { name: "Start your search" }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Student navigation" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Student navigation" })
      .getByRole("link", { name: "Explore" }),
  ).toHaveAttribute("aria-current", "page");

  await page.getByRole("button", { name: "Start your search" }).click();
  const searchDialog = page.getByRole("dialog", { name: "Search stays" });
  await expect(searchDialog).toBeVisible();
  await searchDialog.getByLabel("Destination").fill("Murree");
  await searchDialog.getByLabel("Move-in date").fill("2026-11-01");
  await searchDialog.getByLabel("Guests").selectOption("2");
  await searchDialog.getByRole("button", { name: "Close search" }).click();
  await expect(searchDialog).toBeHidden();

  await page.getByRole("button", { name: "Start your search" }).click();
  await expect(searchDialog.getByLabel("Destination")).toHaveValue("Murree");
  const hostelRequest = page.waitForRequest(
    (request) =>
      request.url().includes("/api/hostels?") &&
      new URL(request.url()).searchParams.get("city") === "Murree",
  );
  await searchDialog.getByRole("button", { name: "Search hostels" }).click();
  const request = await hostelRequest;
  const params = new URL(request.url()).searchParams;

  expect(params.get("city")).toBe("Murree");
  expect(params.has("moveInDate")).toBe(false);
  expect(params.has("guests")).toBe(false);
  await expect(page).toHaveURL(/\/search\?city=Murree$/);
  await expect(
    page.getByRole("heading", { name: "Hostels in Murree" }),
  ).toBeVisible();
});

test("mobile_categories_filter_listings_and_signed_out_save_opens_login", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  const categories = page.locator(".browse-mobile-category-nav");
  const womenOnly = categories.getByRole("button", { name: "Women-only" });
  await womenOnly.click();

  await expect(womenOnly).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("heading", { name: "Lahore Student Stay 1" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Lahore Student Stay 2" }),
  ).toHaveCount(0);

  await page
    .getByRole("link", {
      name: "Sign in to save Lahore Student Stay 1 to Wishlists",
    })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Log in to HostelLo" }),
  ).toBeVisible();
});

test("student_pages_redirect_anonymous_visitors_to_the_intended_login_callback", async ({
  page,
}) => {
  for (const path of ["/wishlists", "/trips", "/profile"]) {
    await page.goto(path);
    await expect(page).toHaveURL(
      new RegExp(`/login\\?callbackUrl=%2F${path.slice(1)}$`),
    );
    await expect(page.getByRole("dialog")).toBeVisible();
  }
});

test("mobile_and_desktop_layouts_fit_the_viewport_and_keep_navigation_consistent", async ({
  page,
}) => {
  for (const width of [320, 375, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");

    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);

    const navigation = page.locator(".mobile-tab-navigation");
    const isMobile = width <= 720;

    if (isMobile) {
      await expect(navigation).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Start your search" }),
      ).toBeVisible();
      const clearance = await page.locator(".browse-listings").evaluate((element) => {
        const nav = document.querySelector(".mobile-tab-navigation");
        return {
          paddingBottom: Number.parseFloat(getComputedStyle(element).paddingBottom),
          navigationHeight: nav?.getBoundingClientRect().height ?? 0,
          navigationBottom: nav?.getBoundingClientRect().bottom ?? -1,
        };
      });
      expect(clearance.navigationBottom).toBe(900);
      expect(clearance.paddingBottom).toBeGreaterThanOrEqual(92);
      expect(clearance.navigationHeight).toBeGreaterThanOrEqual(64);
    } else {
      await expect(navigation).toBeHidden();
      await expect(
        page.getByRole("searchbox", { name: "Destination" }),
      ).toBeVisible();
      await expect(page.locator(".browse-mobile-search-trigger")).toBeHidden();
    }
  }
});

test("homepage_marketplace_layout_scales_listings_for_desktop_tablet_and_phone", async ({
  page,
}) => {
  for (const viewport of [
    { width: 1440, height: 900, minImageWidth: 165, maxHeaderHeight: 100 },
    { width: 768, height: 1024, minImageWidth: 150, maxHeaderHeight: 96 },
    { width: 390, height: 844, minImageWidth: 145, maxHeaderHeight: 0 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");

    const firstListingImage = page.locator(".hostel-card-image").first();
    await expect(firstListingImage).toBeVisible();
    await expect
      .poll(() => firstListingImage.evaluate((image) => image.clientWidth))
      .toBeGreaterThanOrEqual(viewport.minImageWidth);

    if (viewport.maxHeaderHeight > 0) {
      await expect
        .poll(() =>
          page.locator(".browse-header").evaluate((header) =>
            Math.round(header.getBoundingClientRect().height),
          ),
        )
        .toBeLessThanOrEqual(viewport.maxHeaderHeight);
    }

    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});

test("homepage_interaction_motion_is_disabled_when_reduced_motion_is_preferred", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const favoriteButton = page.locator(".hostel-favorite-button").first();
  await favoriteButton.hover();
  await expect
    .poll(() =>
      favoriteButton.evaluate((button) => getComputedStyle(button).transform),
    )
    .not.toBe("none");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();

  const firstCard = page.locator(".hostel-card").first();
  await expect
    .poll(() =>
      firstCard.evaluate((card) => getComputedStyle(card).animationName),
    )
    .toBe("none");

  const reducedMotionFavorite = page.locator(".hostel-favorite-button").first();
  await reducedMotionFavorite.hover();
  await expect
    .poll(() =>
      reducedMotionFavorite.evaluate(
        (button) => getComputedStyle(button).transform,
      ),
    )
    .toBe("none");
});
