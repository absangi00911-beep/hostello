import { expect, test, type Page } from "@playwright/test";

const hostelId = "cmvp8pemp000ogwvvh5cnpm6g";
const conversationId = "conversation-e2e-messages";
const pendingInquiryKey = "hostello:pending-inquiry:v1";

const preview = {
  id: conversationId,
  hostelName: "Green Valley Boys Hostel",
  hostel: {
    name: "Green Valley Boys Hostel",
    slug: "green-valley-boys-hostel",
    coverImage: null,
  },
  participants: [
    {
      userId: "test-student",
      user: {
        id: "test-student",
        name: "Hamza Malik",
        avatar: null,
        role: "STUDENT",
        studentVerified: true,
      },
    },
    {
      userId: "test-owner",
      user: {
        id: "test-owner",
        name: "Ali Raza",
        avatar: null,
        role: "OWNER",
        studentVerified: false,
      },
    },
  ],
  messages: [
    {
      content: "Could I move in next month?",
      read: false,
      senderId: "test-student",
      createdAt: "2026-10-26T12:00:00.000Z",
    },
  ],
  unreadCount: 1,
  updatedAt: "2026-10-26T12:00:00.000Z",
};

function conversationPayload(messages = preview.messages) {
  return {
    ...preview,
    messages: messages.map((message, index) => ({
      id: `message-${index + 1}`,
      ...message,
      sender: {
        id: message.senderId,
        name: message.senderId === "test-student" ? "Hamza Malik" : "Ali Raza",
        avatar: null,
      },
    })),
    booking: null,
    messageTotal: messages.length,
    messagePage: 1,
    messageLimit: 50,
    messageHasMore: false,
  };
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/login?callbackUrl=%2Fmessages");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/messages(?:\?.*)?$/);
}

async function mockMessagesApi(
  page: Page,
  expectedInquiry?: { hostelId: string; message: string },
) {
  let messages = [...preview.messages];
  let unreadCount = preview.unreadCount;

  await page.route("**/api/conversations**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/conversations" && route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [{ ...preview, unreadCount }],
          total: 1,
          page: Number(url.searchParams.get("page") ?? 1),
          limit: 20,
          hasMore: false,
        }),
      });
      return;
    }

    if (url.pathname === "/api/conversations" && route.request().method() === "POST") {
      const body = route.request().postDataJSON() as {
        hostelId: string;
        initialMessage: string;
      };
      if (expectedInquiry) {
        expect(body).toEqual({
          hostelId: expectedInquiry.hostelId,
          initialMessage: expectedInquiry.message,
        });
      }
      messages = [
        {
          content: body.initialMessage,
          read: false,
          senderId: "test-student",
          createdAt: "2026-10-26T12:00:00.000Z",
        },
      ];
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ data: { id: "conversation-42" } }),
      });
      return;
    }

    if (url.pathname.endsWith(`/${conversationId}`) && route.request().method() === "POST") {
      const body = route.request().postDataJSON() as { content: string };
      messages = [
        ...messages,
        {
          content: body.content,
          read: false,
          senderId: "test-owner",
          createdAt: "2026-10-26T12:01:00.000Z",
        },
      ];
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ data: { id: "message-sent", ...body } }),
      });
      return;
    }

    const id = url.pathname.split("/").at(-1);
    if (id === conversationId) unreadCount = 0;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: conversationPayload(
          id === "conversation-42"
            ? [
                {
                  content: "Could I move in next month?",
                  read: true,
                  senderId: "test-student",
                  createdAt: "2026-10-26T12:00:00.000Z",
                },
              ]
            : messages,
        ),
      }),
    });
  });
}

test("signed_out_visitors_are_redirected_to_login_with_a_safe_inbox_callback", async ({
  page,
}) => {
  await page.goto("/messages?pendingInquiry=1");

  await expect(page).toHaveURL(
    "/login?callbackUrl=%2Fmessages%3FpendingInquiry%3D1",
  );
  expect(page.url()).not.toContain("Could%20I");
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("students_can_open_threads_and_send_messages", async ({
  page,
}) => {
  const email = process.env.SEED_STUDENT_EMAIL;
  const password = process.env.SEED_STUDENT_PASSWORD;
  test.skip(!email || !password, "requires seeded student credentials");

  await mockMessagesApi(page);
  await login(page, email!, password!);
  await expect(page.getByRole("heading", { name: "Messages" })).toBeVisible();
  await expect(page.getByText("1", { exact: true }).last()).toBeVisible();
  await page.getByRole("button", { name: /Hamza Malik.*Green Valley/ }).click();
  const thread = page.getByRole("region", { name: "Conversation" });
  await expect(thread.getByText("Could I move in next month?")).toBeVisible();

  await page.getByLabel("Write a message").fill("I can visit on Saturday.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(thread.getByText("I can visit on Saturday.")).toBeVisible();
});

test("owners_can_open_threads_and_mark_incoming_messages_read", async ({
  page,
}) => {
  const email = process.env.SEED_OWNER_1_EMAIL;
  const password = process.env.SEED_OWNER_PASSWORD;
  test.skip(!email || !password, "requires seeded owner credentials");

  await mockMessagesApi(page);
  await login(page, email!, password!);
  await expect(page.getByRole("heading", { name: "Messages" })).toBeVisible();
  await page.getByRole("button", { name: /Hamza Malik.*Green Valley/ }).click();
  await expect(
    page
      .getByRole("region", { name: "Conversation" })
      .getByText("Could I move in next month?"),
  ).toBeVisible();
  await expect(page.getByLabel(/unread messages/)).toHaveCount(0);
});

test("administrators_are_denied_access_to_the_messages_inbox", async ({
  page,
}) => {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  test.skip(!email || !password, "requires seeded admin credentials");

  await page.goto("/login?callbackUrl=%2Fmessages");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page).toHaveURL(/\/messages/);
  await expect(page.getByRole("heading", { name: "Messages" })).toHaveCount(0);
});

test("signed_out_inquiries_are_delivered_after_login_and_open_the_thread", async ({
  page,
}) => {
  const email = process.env.SEED_STUDENT_EMAIL;
  const password = process.env.SEED_STUDENT_PASSWORD;
  test.skip(!email || !password, "requires seeded student credentials");

  const draft = {
    hostelId,
    hostelName: "Green Valley Boys Hostel",
    message: "Could I move in next month?",
  };
  await page.addInitScript(
    ({ key, value }) => sessionStorage.setItem(key, JSON.stringify(value)),
    { key: pendingInquiryKey, value: draft },
  );
  await mockMessagesApi(page, {
    hostelId: draft.hostelId,
    message: draft.message,
  });
  await page.goto("/messages?pendingInquiry=1");
  await expect(page).toHaveURL(
    "/login?callbackUrl=%2Fmessages%3FpendingInquiry%3D1",
  );
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page).toHaveURL("/messages?conversationId=conversation-42");
  await expect(
    page
      .getByRole("region", { name: "Conversation" })
      .getByText("Could I move in next month?"),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate((key) => sessionStorage.getItem(key), pendingInquiryKey),
    )
    .toBeNull();
});

test("messages_inbox_has_no_horizontal_overflow_at_required_viewports", async ({
  page,
}) => {
  const email = process.env.SEED_STUDENT_EMAIL;
  const password = process.env.SEED_STUDENT_PASSWORD;
  test.skip(!email || !password, "requires seeded student credentials");

  await mockMessagesApi(page);
  await login(page, email!, password!);

  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
    await expect(page.getByRole("heading", { name: "Messages" })).toBeVisible();
  }
});

test("a nonparticipant_cannot_load_an_existing_private_conversation", async ({
  browser,
  page,
}) => {
  const studentEmail = process.env.SEED_STUDENT_EMAIL;
  const studentPassword = process.env.SEED_STUDENT_PASSWORD;
  const otherOwnerEmail = process.env.SEED_OWNER_2_EMAIL;
  const ownerPassword = process.env.SEED_OWNER_PASSWORD;
  test.skip(
    !studentEmail || !studentPassword || !otherOwnerEmail || !ownerPassword,
    "requires seeded student and second-owner credentials",
  );

  await login(page, studentEmail!, studentPassword!);
  const createResponse = await page.request.post("/api/conversations", {
    data: {
      hostelId,
      initialMessage: `Private thread access check ${Date.now()}`,
    },
  });
  expect(createResponse.ok()).toBe(true);
  const created: unknown = await createResponse.json();
  if (
    typeof created !== "object" ||
    created === null ||
    !("data" in created) ||
    typeof created.data !== "object" ||
    created.data === null ||
    !("id" in created.data) ||
    typeof created.data.id !== "string"
  ) {
    throw new Error("Conversation API did not return its ID.");
  }
  const privateConversationId = created.data.id;

  const otherOwnerContext = await browser.newContext();
  const otherOwnerPage = await otherOwnerContext.newPage();
  try {
    await login(otherOwnerPage, otherOwnerEmail!, ownerPassword!);
    const privateThread = await otherOwnerPage.request.get(
      `/api/conversations/${encodeURIComponent(privateConversationId)}`,
    );
    expect(privateThread.status()).toBe(404);
    await otherOwnerPage.goto(
      `/messages?conversationId=${encodeURIComponent(privateConversationId)}`,
    );
    await expect(otherOwnerPage.getByRole("alert")).toContainText(
      "Conversation not found",
    );
  } finally {
    await otherOwnerContext.close();
  }
});
