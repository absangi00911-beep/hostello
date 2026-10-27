import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/config", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    conversation: { findFirst: vi.fn(), update: vi.fn() },
    booking: { findFirst: vi.fn() },
    message: { findMany: vi.fn(), count: vi.fn(), updateMany: vi.fn(), create: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn() }));
vi.mock("@/lib/notifications", () => ({ createNotification: vi.fn() }));
vi.mock("@/lib/host-response-summary", () => ({
  refreshHostResponseSummary: vi.fn(),
}));

import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { rateLimit } from "@/lib/rate-limit";
import { refreshHostResponseSummary } from "@/lib/host-response-summary";
import { GET, POST } from "./route";

const context = { params: Promise.resolve({ id: "conversation_1" }) };
const request = (query = "") => new NextRequest(`https://hostello.test/api/conversations/conversation_1${query}`);
const transactionClient = {
  message: { create: vi.fn() },
  conversation: { update: vi.fn() },
};

function runTransaction(callback: (tx: typeof transactionClient) => unknown) {
  return callback(transactionClient);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth).mockResolvedValue({ user: { id: "student_1", role: "STUDENT" } } as any);
  vi.mocked(rateLimit).mockResolvedValue({ ok: true, remaining: 119, resetAt: Date.now() + 60_000 });
  vi.mocked(db.conversation.findFirst).mockResolvedValue({
    id: "conversation_1",
    hostelId: "hostel_1",
    hostel: { ownerId: "owner_1", name: "Hostel One", slug: "hostel-one", coverImage: null },
    participants: [
      { userId: "student_1", user: { id: "student_1", name: "Student", role: "STUDENT" } },
      { userId: "owner_1", user: { id: "owner_1", name: "Owner", role: "OWNER" } },
    ],
  } as any);
  vi.mocked(db.booking.findFirst).mockResolvedValue(null as any);
  vi.mocked(db.message.updateMany).mockResolvedValue({ count: 0 } as any);
  vi.mocked(db.conversation.update).mockResolvedValue({} as any);
  vi.mocked(db.message.create).mockResolvedValue({
    id: "message_4",
    content: "Hello, I would like to ask about the room.",
    sender: { id: "student_1", name: "Student", avatar: null },
  } as any);
  transactionClient.message.create.mockResolvedValue({
    id: "message_4",
    content: "Hello, I would like to ask about the room.",
    sender: { id: "student_1", name: "Student", avatar: null },
  } as never);
  transactionClient.conversation.update.mockResolvedValue({} as never);
  vi.mocked(db.$transaction).mockImplementation((async (callback: (tx: typeof transactionClient) => unknown) =>
    runTransaction(callback)) as typeof db.$transaction);
  vi.mocked(createNotification).mockResolvedValue(null as any);
  vi.mocked(refreshHostResponseSummary).mockResolvedValue(undefined);
});

describe("POST /api/conversations/[id]", () => {
  it("hides non-participant conversation IDs before parsing or writing a message", async () => {
    vi.mocked(db.conversation.findFirst).mockResolvedValue(null as any);
    const response = await POST(new NextRequest(
      "https://hostello.test/api/conversations/conversation_1",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: "Hello, I would like to ask about the room." }),
      },
    ), context as any);

    expect(response.status).toBe(404);
    expect(db.conversation.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "conversation_1", participants: { some: { userId: "student_1" } } },
    }));
    expect(transactionClient.message.create).not.toHaveBeenCalled();
  });

  it("refreshes_summary_on_owner_reply", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "owner_1", role: "OWNER" } } as any);
    const response = await POST(new NextRequest(
      "https://hostello.test/api/conversations/conversation_1",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: "Yes, we have a room." }),
      },
    ), context as any);

    expect(response.status).toBe(201);
    expect(refreshHostResponseSummary).toHaveBeenCalledWith("owner_1", transactionClient);
    expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: "Serializable",
    });
  });

  it("rolls_back_message_when_summary_refresh_fails", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "owner_1", role: "OWNER" } } as any);
    vi.mocked(refreshHostResponseSummary).mockRejectedValue(new Error("summary failed"));

    const response = await POST(new NextRequest(
      "https://hostello.test/api/conversations/conversation_1",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: "Yes, we have a room." }),
      },
    ), context as any);

    expect(response.status).toBe(500);
    expect(transactionClient.message.create).toHaveBeenCalled();
    expect(refreshHostResponseSummary).toHaveBeenCalledWith("owner_1", transactionClient);
    expect(createNotification).not.toHaveBeenCalled();
  });

  it("retries_serializable_conflicts_without_duplicate_notifications", async () => {
    const conflict = Object.assign(new Error("serialization conflict"), { code: "P2034" });
    let committedMessageCount = 0;
    vi.mocked(auth).mockResolvedValue({ user: { id: "owner_1", role: "OWNER" } } as any);
    vi.mocked(db.$transaction)
      .mockImplementationOnce((async (callback: (tx: typeof transactionClient) => unknown) => {
        await runTransaction(callback);
        throw conflict;
      }) as typeof db.$transaction)
      .mockImplementationOnce((async (callback: (tx: typeof transactionClient) => unknown) =>
        {
          const result = await runTransaction(callback);
          committedMessageCount += 1;
          return result;
        }) as typeof db.$transaction);

    const response = await POST(new NextRequest(
      "https://hostello.test/api/conversations/conversation_1",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: "Hello, I would like to ask about the room." }),
      },
    ), context as any);

    expect(response.status).toBe(201);
    expect(db.$transaction).toHaveBeenCalledTimes(2);
    expect(transactionClient.message.create).toHaveBeenCalledTimes(2);
    expect(committedMessageCount).toBe(1);
    expect(refreshHostResponseSummary).toHaveBeenCalledTimes(2);
    expect(createNotification).toHaveBeenCalledTimes(1);
  });

  it("does not put participant identifiers or raw errors in notification failure logs", async () => {
    const sensitiveError = new Error("private recipient email=student@example.com");
    vi.mocked(createNotification).mockRejectedValue(sensitiveError);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(new NextRequest(
      "https://hostello.test/api/conversations/conversation_1",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: "Hello, I would like to ask about the room." }),
      },
    ), context as any);

    expect(response.status).toBe(201);
    expect(errorSpy).toHaveBeenCalledWith(
      "[conversations] Notification delivery failed:",
      { name: "Error" },
    );
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain("student@example.com");
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain("conversation_1");
    errorSpy.mockRestore();
  });
});

describe("GET /api/conversations/[id]", () => {
  it("requires a signed-in participant", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const response = await GET(request(), context as any);

    expect(response.status).toBe(401);
    expect(db.conversation.findFirst).not.toHaveBeenCalled();
  });

  it("rejects an oversized conversation ID before querying messages", async () => {
    const response = await GET(request(), {
      params: Promise.resolve({ id: "x".repeat(129) }),
    } as any);

    expect(response.status).toBe(400);
    expect(db.conversation.findFirst).not.toHaveBeenCalled();
    expect(db.message.findMany).not.toHaveBeenCalled();
  });

  it("returns a bounded page in chronological order and marks incoming messages read", async () => {
    vi.mocked(db.message.findMany).mockResolvedValue([
      { id: "message_3", senderId: "owner_1", content: "Latest", createdAt: new Date("2026-10-03"), read: false, sender: { id: "owner_1", name: "Owner", avatar: null } },
      { id: "message_2", senderId: "student_1", content: "Earlier", createdAt: new Date("2026-10-02"), read: true, sender: { id: "student_1", name: "Student", avatar: null } },
    ] as any);
    vi.mocked(db.message.count).mockResolvedValue(250 as any);

    const response = await GET(request("?page=2&limit=100"), context as any);
    const body = await response.json();

    expect(db.message.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { conversationId: "conversation_1" },
      skip: 100,
      take: 100,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    }));
    expect(body.data.messages.map((message: { id: string }) => message.id)).toEqual(["message_2", "message_3"]);
    expect(body.data).toMatchObject({ messageTotal: 250, messagePage: 2, messageLimit: 100, messageHasMore: true });
    expect(db.message.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { conversationId: "conversation_1", read: false, senderId: { not: "student_1" } },
    }));
  });

  it("hides conversations from users who are not participants", async () => {
    vi.mocked(db.conversation.findFirst).mockResolvedValue(null as any);

    const response = await GET(request(), context as any);

    expect(response.status).toBe(404);
    expect(db.conversation.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "conversation_1", participants: { some: { userId: "student_1" } } },
    }));
    expect(db.message.findMany).not.toHaveBeenCalled();
    expect(db.message.updateMany).not.toHaveBeenCalled();
  });

  it("does not let an admin read or mark read a non-participant conversation", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "admin_1", role: "ADMIN" } } as any);
    vi.mocked(db.conversation.findFirst).mockResolvedValue(null as any);

    const response = await GET(request(), context as any);

    expect(response.status).toBe(404);
    expect(db.conversation.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "conversation_1", participants: { some: { userId: "admin_1" } } },
    }));
    expect(db.message.findMany).not.toHaveBeenCalled();
    expect(db.message.updateMany).not.toHaveBeenCalled();
  });
});
