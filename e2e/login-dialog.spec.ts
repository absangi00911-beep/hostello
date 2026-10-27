import { expect, test } from "@playwright/test";

test("guest_can_still_start_the_host_sign_up_flow", async ({ page }) => {
  await page.goto("/");

  const becomeHost = page.getByRole("link", { name: "Become a host" });
  await expect(becomeHost).toBeVisible();
  await expect(becomeHost).toHaveAttribute("href", "/signup?role=OWNER");
});

test("login_opens_as_a_shareable_dialog_over_hostel_discovery", async ({
  page,
}) => {
  await page.route("**/api/auth/email-otp", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: "Code sent." }),
    }),
  );
  await page.goto("/");
  await page.getByRole("link", { name: "Sign in" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Log in to HostelLo" }),
  ).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveValue("");
  await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();
  await expect(page.getByText("Enter your email to receive a one-time login code.")).toBeVisible();
  await expect(page.locator(".browse-home")).toBeVisible();

  await page.getByLabel("Email").fill("student@example.com");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByLabel("6-digit code")).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Use another email" })).toBeVisible();
  await expect(page).toHaveURL("/");
  await expect(page.locator(".browse-home")).toBeVisible();

  await page.getByRole("button", { name: "Close login dialog" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("direct_login_url_keeps_the_listings_context_and_displays_auth_feedback", async ({
  page,
}) => {
  await page.goto("/login?verified=1");

  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".browse-home")).toBeVisible();
  await expect(
    page.getByRole("status").getByText("Your email has been verified."),
  ).toBeVisible();
});

test("login_shows_an_actionable_error_for_existing_oauth_accounts", async ({
  page,
}) => {
  await page.goto("/login?error=OAuthAccountNotLinked");

  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog").getByRole("alert")).toHaveText(
    "This email is already linked to an account. Enter it to receive a login code.",
  );
});

test("login_requires_a_valid_email_before_showing_the_otp_step", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("bad-email");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("dialog").getByRole("alert")).toHaveText(
    "Enter a valid email address to continue.",
  );
  await expect(page.getByLabel("6-digit code")).toHaveCount(0);
});

test("email_login_uses_the_airbnb_style_otp_flow", async ({
  page,
}) => {
  await page.route("**/api/auth/email-otp", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: "Code sent." }),
    }),
  );
  await page.goto("/login");
  await page.getByLabel("Email").fill("student@example.com");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("button", { name: "Use another email" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Resend code" })).toBeVisible();
});

test("verified_code_closes_the_modal_without_changing_the_url_when_auth_succeeds", async ({
  page,
}) => {
  await page.route("**/api/auth/email-otp", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: "Code sent." }),
    }),
  );
  await page.route("**/api/auth/email-otp/verify", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ grant: "a".repeat(64), needsName: false }),
    }),
  );
  await page.route("**/api/auth/callback/email-otp**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ url: new URL("/", page.url()).toString() }),
    }),
  );

  await page.goto("/");
  await page.getByRole("link", { name: "Sign in" }).click();
  await page.getByLabel("Email").fill("student@example.com");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("6-digit code").fill("123456");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL("/");
  await expect(page.locator(".browse-home")).toBeVisible();
});

test("verified_new_email_requires_a_name_before_creating_a_student_account", async ({
  page,
}) => {
  await page.route("**/api/auth/email-otp", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: "Code sent." }),
    }),
  );
  await page.route("**/api/auth/email-otp/verify", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ grant: "b".repeat(64), needsName: true }),
    }),
  );
  await page.route("**/api/auth/callback/email-otp**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ url: new URL("/", page.url()).toString() }),
    }),
  );

  await page.goto("/");
  await page.getByRole("link", { name: "Sign in" }).click();
  await page.getByLabel("Email").fill("new-student@example.com");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("6-digit code").fill("123456");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByLabel("Name")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
  await page.getByLabel("Name").fill("New Student");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL("/");
});

test("invalid_code_keeps_the_dialog_open_and_does_not_authenticate", async ({
  page,
}) => {
  await page.route("**/api/auth/email-otp", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: "Code sent." }),
    }),
  );
  await page.route("**/api/auth/email-otp/verify", (route) =>
    route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({
        error: "That code is invalid or has expired. Request a new one.",
      }),
    }),
  );

  await page.goto("/");
  await page.getByRole("link", { name: "Sign in" }).click();
  await page.getByLabel("Email").fill("student@example.com");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("6-digit code").fill("123456");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("dialog").getByRole("alert")).toHaveText(
    "That code is invalid or has expired. Request a new one.",
  );
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page).toHaveURL("/");
});

test("nextauth_exposes_the_email_otp_provider", async ({ page }) => {
  await page.goto("/");
  const response = await page.request.get("/api/auth/providers");
  expect(response.ok()).toBe(true);

  const providers: unknown = await response.json();
  expect(providers).toEqual(
    expect.objectContaining({ "email-otp": expect.any(Object) }),
  );
});

test("login_dialog_fits_mobile_and_short_landscape_viewports", async ({
  page,
}) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 640, height: 360 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/login");

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const bounds = await dialog.boundingBox();
    expect(bounds).not.toBeNull();
    if (!bounds) throw new Error("Login dialog has no rendered bounds.");

    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
  }
});

test("escape_closes_the_login_dialog", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Sign in" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();

  await page.keyboard.press("Escape");

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
