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
    page.getByRole("heading", { name: `Best hostel in ${city}` }),
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
    page.getByRole("heading", { name: `Best hostel in ${city}` }),
  ).toBeVisible();
  await apiRequest;
});

test("hostel details show the public listing overview", async ({ page }) => {
  await page.goto(`/hostels/${hostelId}`);

  await expect(
    page.getByRole("group", { name: "Guest rating and verification" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Stay highlights" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "About this hostel" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("region", { name: "Stay highlights" })
      .getByText(/Up to \d+ residents?/),
  ).toBeVisible();
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
    name: "Best hostel in Lahore",
  });
  await expect(sectionHeading).toBeVisible();
  await expect(sectionHeading).toHaveCSS("font-size", "21px");
  await expect(sectionHeading).toHaveCSS("font-weight", "700");
});
