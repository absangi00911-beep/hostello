import "dotenv/config";
import { expect, test, type Page } from "@playwright/test";

const hostelId = "cmvp8pemp000ogwvvh5cnpm6g";

async function mockHostelSearch(page: Page) {
  await page.route("**/api/hostels**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [
          {
            id: hostelId,
            name: "Garden View Hostel",
            city: "Lahore",
            area: "Gulberg",
            pricePerMonth: 24_000,
            coverImage: null,
            images: [],
            rating: 4.8,
            reviewCount: 12,
          },
        ],
        total: 1,
      }),
    }),
  );
}

test("hostel detail header matches homepage size and wordmark alignment", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });

  const getHeaderMetrics = async () =>
    page.locator(".browse-header").evaluate((header) => {
      const brand = header.querySelector(".browse-brand");
      const headerBounds = header.getBoundingClientRect();
      const brandBounds = brand?.getBoundingClientRect();

      if (!brandBounds) {
        throw new Error("Browse header wordmark is missing");
      }

      return {
        height: headerBounds.height,
        brandLeft: brandBounds.left,
        brandCenterY: brandBounds.top + brandBounds.height / 2,
      };
    });

  await page.goto("/");
  const homepageHeader = await getHeaderMetrics();

  await page.goto(`/hostels/${hostelId}`);
  const detailHeader = page.locator(".hostel-detail-header");
  await expect(detailHeader).toBeVisible();
  await expect(
    detailHeader.getByRole("search", {
      name: "Search for hostels by destination",
    }),
  ).toBeVisible();
  const detailHeaderMetrics = await getHeaderMetrics();

  expect(detailHeaderMetrics.height).toBe(homepageHeader.height);
  expect(detailHeaderMetrics.brandLeft).toBe(homepageHeader.brandLeft);
  expect(detailHeaderMetrics.brandCenterY).toBeCloseTo(
    homepageHeader.brandCenterY,
    1,
  );
});

test("hostel cards open their detail route from browse and search", async ({ page }) => {
  await mockHostelSearch(page);
  await page.goto("/");

  await expect(
    page.getByRole("link", { name: /Garden View Hostel/ }),
  ).toHaveAttribute("href", `/hostels/${hostelId}`);

  await page.goto("/search");
  await page.getByRole("button", { name: "Lahore" }).click();

  await expect(
    page.getByRole("link", { name: /Garden View Hostel/ }),
  ).toHaveAttribute("href", `/hostels/${hostelId}`);
});

test("hostel detail destination search loads results for the requested city", async ({
  page,
}) => {
  await mockHostelSearch(page);
  await page.goto(`/hostels/${hostelId}`);

  const city = "Rawalpindi";
  const apiRequest = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return (
      url.pathname === "/api/hostels" &&
      url.searchParams.get("city") === city
    );
  });

  await page.getByRole("searchbox", { name: "Search by city" }).fill(city);
  await page.getByRole("button", { name: "Search hostels" }).click();
  await expect(page).toHaveURL(/\/search\?city=Rawalpindi$/);
  await expect(
    page.getByRole("heading", { name: `Hostels in ${city}` }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Garden View Hostel/ }),
  ).toBeVisible();
  await apiRequest;
});

test("hostel detail destination search encodes and restores punctuation", async ({
  page,
}) => {
  await mockHostelSearch(page);
  await page.goto(`/hostels/${hostelId}`);

  const city = "New Town & Gardens";
  const apiRequest = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return (
      url.pathname === "/api/hostels" &&
      url.searchParams.get("city") === city
    );
  });

  await page.getByRole("searchbox", { name: "Search by city" }).fill(city);
  await page.getByRole("button", { name: "Search hostels" }).click();
  await expect(page).toHaveURL((url) => url.searchParams.get("city") === city);
  await expect(
    page.getByRole("heading", { name: `Hostels in ${city}` }),
  ).toBeVisible();
  await apiRequest;
});

test("search ignores whitespace-only city query parameters", async ({ page }) => {
  const requestedCities: Array<string | null> = [];

  await page.route("**/api/hostels**", async (route) => {
    requestedCities.push(
      new URL(route.request().url()).searchParams.get("city"),
    );
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [], total: 0 }),
    });
  });

  await page.goto("/search?city=+++");
  const citySearch = page.getByLabel("Search for a city");
  await citySearch.fill("No city with this name");
  await expect(page.getByText("No matching city found.")).toBeVisible();
  await citySearch.fill("");
  await expect(page.getByText("No matching city found.")).not.toBeVisible();
  await expect(page.getByText(/Selected city:/)).toHaveCount(0);
  expect(requestedCities).toEqual([]);
});

test("hostel detail uses centered content and a responsive gallery of real hostel and room photos", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`/hostels/${hostelId}`);

  const wordmark = page.getByRole("link", { name: "hostello home" });
  await expect(wordmark).toHaveText("hostello");
  await expect(wordmark.locator(".browse-brand-mark")).toHaveCount(0);

  const search = page.getByRole("search", {
    name: "Search for hostels by destination",
  });
  await expect(search).toBeVisible();

  const shell = page.locator(".hostel-detail-shell");
  const shellBounds = await shell.evaluate((element) => {
    const { left, width } = element.getBoundingClientRect();
    return { left, width };
  });
  const viewportWidth = await page.evaluate(
    () => document.documentElement.clientWidth,
  );
  expect(shellBounds.width).toBeLessThanOrEqual(1120);
  expect(shellBounds.left).toBeCloseTo(
    (viewportWidth - shellBounds.width) / 2,
    0,
  );

  const gallery = page.locator('.hostel-detail-gallery[data-photo-count="4"]');
  await expect(gallery.locator(".hostel-detail-photo img")).toHaveCount(4);
  await expect(
    gallery.getByRole("img", {
      name: "Triple Study Room room photo for Baloch Scholars Hostel",
    }),
  ).toBeVisible();
  const galleryBounds = await gallery.boundingBox();
  const photoBounds = await gallery
    .locator(".hostel-detail-photo")
    .first()
    .boundingBox();
  expect(galleryBounds).not.toBeNull();
  expect(photoBounds).not.toBeNull();
  if (!galleryBounds || !photoBounds) {
    throw new Error("The one-photo gallery must have measurable dimensions.");
  }
  expect(photoBounds.x).toBeCloseTo(galleryBounds.x, 0);
  expect(photoBounds.width).toBeGreaterThan(galleryBounds.width * 0.45);
  expect(galleryBounds.height).toBeLessThanOrEqual(
    galleryBounds.width * 0.42,
  );
  const titleRowBounds = await page
    .locator(".hostel-detail-title-row")
    .boundingBox();
  expect(titleRowBounds).not.toBeNull();
  if (!titleRowBounds) {
    throw new Error("The listing title row must have measurable dimensions.");
  }
  expect(titleRowBounds.y + titleRowBounds.height).toBeLessThanOrEqual(
    galleryBounds.y,
  );

  const overview = page.locator(".hostel-detail-summary");
  const bookingCard = page.locator(".hostel-booking-card");
  const roomSection = page.locator(".hostel-room-section");
  const [overviewBounds, bookingBounds] = await Promise.all([
    overview.boundingBox(),
    bookingCard.boundingBox(),
  ]);
  expect(overviewBounds).not.toBeNull();
  expect(bookingBounds).not.toBeNull();
  if (!overviewBounds || !bookingBounds) {
    throw new Error("Overview and booking card must have measurable dimensions.");
  }
  expect(Math.abs(overviewBounds.y - bookingBounds.y)).toBeLessThanOrEqual(16);
  expect(bookingBounds.x).toBeGreaterThan(overviewBounds.x);

  const photoDialog = page.getByRole("dialog", {
    name: "Photos of Baloch Scholars Hostel",
  });
  await page.getByRole("button", { name: /Show all \d+ photos/ }).click();
  await expect(photoDialog).toBeVisible();
  await photoDialog.getByRole("button", { name: "Close photos" }).click();
  await expect(photoDialog).not.toBeVisible();

  await page.setViewportSize({ width: 375, height: 812 });
  await expect(search).toBeVisible();
  await expect(
    page.getByRole("searchbox", { name: "Search by city" }),
  ).toBeVisible();
  const [mobileOverview, mobileBooking, mobileRoom] = await Promise.all([
    overview.boundingBox(),
    bookingCard.boundingBox(),
    roomSection.boundingBox(),
  ]);
  expect(mobileOverview).not.toBeNull();
  expect(mobileBooking).not.toBeNull();
  expect(mobileRoom).not.toBeNull();
  if (!mobileOverview || !mobileBooking || !mobileRoom) {
    throw new Error("Overview, booking card, and rooms must be measurable on mobile.");
  }
  expect(mobileBooking.y).toBeGreaterThanOrEqual(
    mobileOverview.y + mobileOverview.height,
  );
  expect(mobileBooking.y + mobileBooking.height).toBeLessThan(mobileRoom.y);

  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(search).toBeVisible();
    if (width === 768) {
      const tabletGalleryBounds = await gallery.boundingBox();
      expect(tabletGalleryBounds).not.toBeNull();
      if (!tabletGalleryBounds) {
        throw new Error("The narrow-tablet gallery must be measurable.");
      }
      expect(tabletGalleryBounds.height).toBeLessThanOrEqual(
        tabletGalleryBounds.width * 0.42,
      );
    }
    const [viewportWidth, documentWidth] = await page.evaluate(() => [
      document.documentElement.clientWidth,
      document.documentElement.scrollWidth,
    ]);
    expect(documentWidth).toBeLessThanOrEqual(viewportWidth);
  }

  await page.setViewportSize({ width: 375, height: 812 });
  await page.locator(".hostel-detail-title-row h1").evaluate((element) => {
    element.textContent = "LongHostelName".repeat(20);
  });
  await page
    .locator(".hostel-detail-area span")
    .evaluate((element) => {
      element.textContent = "LongLocation".repeat(20);
    });
  await page
    .locator(".hostel-room-info h3")
    .first()
    .evaluate((element) => {
      element.textContent = "LongRoomName".repeat(20);
    });
  const documentWidth = await page.evaluate(
    () => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }),
  );
  expect(documentWidth.scrollWidth).toBeLessThanOrEqual(
    documentWidth.clientWidth,
  );
});

test("hostel details show the public listing overview", async ({ page }) => {
  await page.goto(`/hostels/${hostelId}`);

  const gallery = page.locator(".hostel-detail-gallery");
  const overview = page.getByRole("region", { name: "Hostel overview" });
  await expect(
    overview.getByRole("heading", { name: "Men’s hostel in Quetta" }),
  ).toBeVisible();
  await expect(overview.getByText("Sariab Road")).toBeVisible();
  await expect(
    overview.getByRole("group", { name: "Listing rating and verification" }),
  ).toBeVisible();
  await expect(
    overview.getByRole("heading", { name: "About this hostel" }),
  ).toBeVisible();

  const [galleryBottom, overviewTop] = await Promise.all([
    gallery.evaluate((element) => element.getBoundingClientRect().bottom),
    overview.evaluate((element) => element.getBoundingClientRect().top),
  ]);
  expect(overviewTop).toBeGreaterThan(galleryBottom);
});

test("hostel details show available rooms with listing photos and monthly rates", async ({
  page,
}) => {
  await page.goto(`/hostels/${hostelId}`);

  const roomSection = page.getByRole("region", { name: "Where you’ll sleep" });
  await expect(roomSection).toBeVisible();
  await expect(roomSection.getByRole("heading", { name: "Triple Study Room" })).toBeVisible();
  await expect(roomSection.getByText(/PKR 5,200 per month/)).toBeVisible();
  await expect(roomSection.getByRole("img", { name: "Triple Study Room" })).toBeVisible();
});

test("hostel details show listed amenities after the room options", async ({
  page,
}) => {
  await page.goto(`/hostels/${hostelId}`);

  const roomSection = page.getByRole("region", { name: "Where you’ll sleep" });
  const amenitiesSection = page.getByRole("region", {
    name: "What this place offers",
  });
  await expect(amenitiesSection).toBeVisible();
  await expect(
    amenitiesSection.getByRole("heading", { name: "What this place offers" }),
  ).toBeVisible();
  await expect(amenitiesSection.getByRole("listitem")).toHaveCount(6);
  await expect(amenitiesSection.getByText("Wi-Fi")).toBeVisible();
  await expect(amenitiesSection.getByText("CCTV")).toBeVisible();

  const [roomTop, amenitiesTop] = await Promise.all([
    roomSection.evaluate((element) => element.getBoundingClientRect().top),
    amenitiesSection.evaluate((element) => element.getBoundingClientRect().top),
  ]);
  expect(amenitiesTop).toBeGreaterThan(roomTop);
});

test("hostel date calendar selects a stay and syncs with reservation dates", async ({
  page,
}) => {
  await page.goto(`/hostels/${hostelId}`);

  const calendar = page.getByRole("region", { name: "Choose your dates" });
  const amenities = page.getByRole("region", {
    name: "What this place offers",
  });
  await expect(calendar.locator(".hostel-date-calendar-month")).toHaveCount(2);
  const [amenitiesTop, calendarTop] = await Promise.all([
    amenities.evaluate((element) => element.getBoundingClientRect().top),
    calendar.evaluate((element) => element.getBoundingClientRect().top),
  ]);
  expect(calendarTop).toBeGreaterThan(amenitiesTop);

  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const nextMonthDay = Math.min(
    today.getDate(),
    new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate(),
  );
  const moveOut = new Date(
    nextMonth.getFullYear(),
    nextMonth.getMonth(),
    nextMonthDay,
  );
  const formatAccessibleDate = (date: Date) =>
    new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  const formatInputDate = (date: Date) =>
    [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");

  await calendar
    .getByRole("button", {
      name: `Select move-in date ${formatAccessibleDate(today)}`,
    })
    .click();
  await calendar.getByRole("button", { name: "Next month" }).click();
  await calendar
    .getByRole("button", {
      name: `Select move-out date ${formatAccessibleDate(moveOut)}`,
    })
    .click();

  await expect(page.getByLabel("Move in")).toHaveValue(formatInputDate(today));
  await expect(page.getByLabel("Move out")).toHaveValue(formatInputDate(moveOut));

  const changedMoveIn = new Date(moveOut);
  changedMoveIn.setDate(changedMoveIn.getDate() + 1);
  await page.getByLabel("Move in").fill(formatInputDate(changedMoveIn));
  await expect(
    calendar.getByRole("button", {
      name: `Select move-in date ${formatAccessibleDate(changedMoveIn)}`,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Move out")).toHaveValue("");
});

test("hostel reviews follow the date calendar", async ({ page }) => {
  await page.goto(`/hostels/${hostelId}`);

  const calendar = page.getByRole("region", { name: "Choose your dates" });
  const reviews = page.getByRole("region", { name: "Reviews" });
  await expect(reviews.getByRole("heading", { name: "Reviews" })).toBeVisible();

  const [calendarTop, reviewsTop] = await Promise.all([
    calendar.evaluate((element) => element.getBoundingClientRect().top),
    reviews.evaluate((element) => element.getBoundingClientRect().top),
  ]);
  expect(reviewsTop).toBeGreaterThan(calendarTop);

  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const [clientWidth, scrollWidth] = await reviews.evaluate((element) => [
      element.clientWidth,
      element.scrollWidth,
    ]);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  }
});

test("hostel location appears after reviews with an approximate map", async ({
  page,
}) => {
  await page.goto(`/hostels/${hostelId}`);

  const reviews = page.getByRole("region", { name: "Reviews" });
  const location = page.getByRole("region", { name: "Where you’ll be" });
  await expect(location.getByRole("heading", { name: "Where you’ll be" })).toBeVisible();
  const map = location.getByTitle(/Approximate map location/);
  await expect(map).toBeVisible();
  await expect(location.getByText(/exact address is shared after booking/i)).toBeVisible();
  const mapUrl = await map.getAttribute("src");
  if (!mapUrl) throw new Error("The approximate location map has no source URL.");
  expect(new URL(mapUrl).searchParams.get("marker")).toMatch(
    /^-?\d{1,3}\.\d{2},-?\d{1,3}\.\d{2}$/,
  );

  const [reviewsTop, locationTop] = await Promise.all([
    reviews.evaluate((element) => element.getBoundingClientRect().top),
    location.evaluate((element) => element.getBoundingClientRect().top),
  ]);
  expect(locationTop).toBeGreaterThan(reviewsTop);

  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const [clientWidth, scrollWidth] = await location.evaluate((element) => [
      element.clientWidth,
      element.scrollWidth,
    ]);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  }
});

test("the public host section follows location and avoids horizontal overflow", async ({
  page,
}) => {
  await page.goto(`/hostels/${hostelId}`);

  const location = page.getByRole("region", { name: "Where you’ll be" });
  const host = page.getByRole("region", { name: "Meet your host" });
  await expect(host.getByRole("heading", { name: "Meet your host" })).toBeVisible();

  const [locationTop, hostTop] = await Promise.all([
    location.evaluate((element) => element.getBoundingClientRect().top),
    host.evaluate((element) => element.getBoundingClientRect().top),
  ]);
  expect(hostTop).toBeGreaterThan(locationTop);

  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const [[hostClientWidth, hostScrollWidth], [documentClientWidth, documentScrollWidth]] =
      await Promise.all([
        host.evaluate((element) => [element.clientWidth, element.scrollWidth]),
        page.evaluate(() => [
          document.documentElement.clientWidth,
          document.documentElement.scrollWidth,
        ]),
      ]);
    expect(hostScrollWidth).toBeLessThanOrEqual(hostClientWidth);
    expect(documentScrollWidth).toBeLessThanOrEqual(documentClientWidth);
  }
});

test("hostel detail lower sections keep a compact responsive layout", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`/hostels/${hostelId}`);

  const roomSection = page.locator(".hostel-room-section");
  const amenitiesSection = page.locator(".hostel-amenities-section");
  const calendarSection = page.locator(".hostel-date-calendar");
  const reviewsSection = page.locator(".hostel-reviews-section");
  const locationSection = page.locator(".hostel-location-section");
  const hostSection = page.locator(".hostel-host-section");
  const sections = [
    roomSection,
    amenitiesSection,
    calendarSection,
    reviewsSection,
    locationSection,
    hostSection,
  ];

  const sectionBounds = await Promise.all(
    sections.map((section) => section.boundingBox()),
  );
  expect(sectionBounds.every(Boolean)).toBe(true);
  for (let index = 1; index < sectionBounds.length; index += 1) {
    const previous = sectionBounds[index - 1];
    const current = sectionBounds[index];
    if (!previous || !current) {
      throw new Error("Every lower detail section must be measurable.");
    }
    expect(current.y).toBeGreaterThan(previous.y);
  }

  const getColumnCount = (selector: string) =>
    page.locator(selector).evaluate(
      (element) => getComputedStyle(element).gridTemplateColumns.split(" ").length,
    );
  await expect(roomSection.locator(".hostel-room-grid")).toHaveCount(1);
  expect(await getColumnCount(".hostel-room-grid")).toBe(2);
  expect(await getColumnCount(".hostel-amenities-list")).toBe(2);
  expect(await getColumnCount(".hostel-review-category-list")).toBe(2);
  expect(await getColumnCount(".hostel-review-list")).toBe(2);

  const [categoryBounds, reviewListBounds] = await Promise.all([
    page.locator(".hostel-review-category-list").boundingBox(),
    page.locator(".hostel-review-list").boundingBox(),
  ]);
  expect(categoryBounds).not.toBeNull();
  expect(reviewListBounds).not.toBeNull();
  if (!categoryBounds || !reviewListBounds) {
    throw new Error("Review ratings and review content must be measurable.");
  }
  expect(categoryBounds.x).toBeCloseTo(reviewListBounds.x, 0);
  expect(categoryBounds.width).toBeCloseTo(reviewListBounds.width, 0);

  const map = page.locator(".hostel-location-map");
  const mapBounds = await map.boundingBox();
  expect(mapBounds).not.toBeNull();
  if (!mapBounds) {
    throw new Error("The approximate location map must be measurable.");
  }
  expect(mapBounds.height).toBeLessThanOrEqual(320);

  const hostCardStyle = await page
    .locator(".hostel-host-card")
    .evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        borderRadius: Number.parseFloat(style.borderRadius),
        boxShadow: style.boxShadow,
      };
    });
  expect(hostCardStyle.borderRadius).toBeLessThanOrEqual(12);
  expect(hostCardStyle.boxShadow).toBe("none");

  const locationBounds = await locationSection.boundingBox();
  const hostBounds = await hostSection.boundingBox();
  expect(locationBounds).not.toBeNull();
  expect(hostBounds).not.toBeNull();
  if (!locationBounds || !hostBounds) {
    throw new Error("Location and host sections must be measurable.");
  }
  expect(hostBounds.y - (locationBounds.y + locationBounds.height)).toBeLessThanOrEqual(
    40,
  );

  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const [viewportWidth, documentWidth] = await page.evaluate(() => [
      document.documentElement.clientWidth,
      document.documentElement.scrollWidth,
    ]);
    expect(documentWidth).toBeLessThanOrEqual(viewportWidth);
  }

  for (const width of [768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await getColumnCount(".hostel-room-grid")).toBe(2);
    expect(await getColumnCount(".hostel-amenities-list")).toBe(2);
    expect(await getColumnCount(".hostel-review-category-list")).toBe(2);
    expect(await getColumnCount(".hostel-review-list")).toBe(2);
  }

  await page.setViewportSize({ width: 375, height: 812 });
  expect(await getColumnCount(".hostel-room-grid")).toBe(1);
  expect(await getColumnCount(".hostel-amenities-list")).toBe(1);
  expect(await getColumnCount(".hostel-date-calendar-months")).toBe(1);
  expect(await getColumnCount(".hostel-review-category-list")).toBe(1);
  expect(await getColumnCount(".hostel-review-list")).toBe(1);
});

test("signed-in students navigate to the returned conversation after delivery", async ({
  page,
}) => {
  const email = process.env.SEED_STUDENT_EMAIL;
  const password = process.env.SEED_STUDENT_PASSWORD;
  test.skip(!email || !password, "requires seeded student credentials");

  await page.goto("/login?callbackUrl=%2Fmessages%3FpendingInquiry%3D1");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL("/messages?pendingInquiry=1");

  await page.route("**/api/conversations", async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      hostelId,
      initialMessage: "Could I move in next month?",
    });
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ data: { id: "conversation-e2e-1" } }),
    });
  });
  await page.goto(`/hostels/${hostelId}`);
  await expect(
    page.getByRole("region", { name: "Meet your host" }),
  ).toBeVisible();
  await page.locator(".hostel-host-inquiry summary").click();

  await page
    .getByRole("textbox", { name: "Your message" })
    .fill("Could I move in next month?");
  await page.getByRole("button", { name: "Message the host" }).click();

  await expect(page).toHaveURL("/messages?conversationId=conversation-e2e-1");
  expect(page.url()).not.toContain("Could%20I");
});

test("Google sign-in receives the validated internal callback", async ({
  page,
}) => {
  test.skip(
    !process.env.AUTH_GOOGLE_ID || !process.env.AUTH_GOOGLE_SECRET,
    "requires Google sign-in to be configured",
  );

  await page.route("**/api/auth/signin/google**", async (route) => {
    expect(route.request().postData()).toContain(
      "callbackUrl=%2Fmessages%3FpendingInquiry%3D1",
    );
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ url: "http://127.0.0.1:3100/" }),
    });
  });
  await page.goto(
    "/login?callbackUrl=%2Fmessages%3FpendingInquiry%3D1",
  );

  await page.getByRole("button", { name: "Continue with Google" }).click();
});

test("signed-out inquiry saves a session draft without putting its body in a URL", async ({
  page,
}) => {
  await page.goto(`/hostels/${hostelId}`);
  const hostelName = await page.getByRole("heading", { level: 1 }).innerText();
  await page.locator(".hostel-host-inquiry summary").click();
  await page
    .getByRole("textbox", { name: "Your message" })
    .fill("Could I move in next month?");
  await page.getByRole("button", { name: "Message the host" }).click();

  await expect(page).toHaveURL(
    /\/login\?callbackUrl=%2Fmessages%3FpendingInquiry%3D1$/,
  );
  expect(page.url()).not.toContain("Could%20I");
  await expect
    .poll(() =>
      page.evaluate(() =>
        sessionStorage.getItem("hostello:pending-inquiry:v1"),
      ),
    )
    .toBe(
      JSON.stringify({
        hostelId,
        hostelName,
        message: "Could I move in next month?",
      }),
    );
});

test("signed-out inquiry stays put and reports when session storage fails", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "hostello:pending-inquiry:v1") {
        throw new DOMException("Storage unavailable", "QuotaExceededError");
      }
      originalSetItem.call(this, key, value);
    };
  });
  await page.goto(`/hostels/${hostelId}`);
  await expect(
    page.getByRole("region", { name: "Meet your host" }),
  ).toBeVisible();
  await page.locator(".hostel-host-inquiry summary").click();
  await page
    .getByRole("textbox", { name: "Your message" })
    .fill("Could I move in next month?");
  await page.getByRole("button", { name: "Message the host" }).click();

  await expect(page.locator(".hostel-inquiry-form").getByRole("alert")).toHaveText(
    "We couldn't save your message for sign-in. Please try again.",
  );
  await expect(page).toHaveURL(`/hostels/${hostelId}`);
});

test("uses Inter and the Airbnb-inspired type scale without changing body typography", async ({
  page,
}) => {
  await mockHostelSearch(page);
  await page.goto("/");

  const heading = page.getByRole("heading", { name: "Garden View Hostel" });
  await expect(heading).toBeVisible();

  const [headingFont, headingSize, headingWeight, priceFont, priceSize, bodyFont] =
    await Promise.all([
      heading.evaluate((element) => getComputedStyle(element).fontFamily),
      heading.evaluate((element) => getComputedStyle(element).fontSize),
      heading.evaluate((element) => getComputedStyle(element).fontWeight),
      page
        .locator(".hostel-card-price")
        .evaluate((element) => getComputedStyle(element).fontFamily),
      page
        .locator(".hostel-card-price")
        .evaluate((element) => getComputedStyle(element).fontSize),
      page
        .locator("body")
        .evaluate((element) => getComputedStyle(element).fontFamily),
    ]);

  expect(headingFont).toContain("Inter");
  expect(priceFont).toBe(headingFont);
  expect(headingSize).toBe("14px");
  expect(headingWeight).toBe("600");
  expect(priceSize).toBe("14px");
  expect(bodyFont).not.toContain("Inter");

  await page.goto("/search");
  const pageHeading = page.getByRole("heading", {
    name: "Where do you want to stay?",
  });
  await expect(pageHeading).toBeVisible();
  await expect(pageHeading).toHaveCSS("font-size", "28px");
  await expect(pageHeading).toHaveCSS("font-weight", "700");

  await page.getByRole("button", { name: "Lahore" }).click();
  const sectionHeading = page.getByRole("heading", {
    name: "Hostels in Lahore",
  });
  await expect(sectionHeading).toBeVisible();
  await expect(sectionHeading).toHaveCSS("font-size", "21px");
  await expect(sectionHeading).toHaveCSS("font-weight", "700");
});
