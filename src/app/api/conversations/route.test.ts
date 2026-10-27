import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: vi.fn(),
    conversation: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    hostel: {
      findUnique: vi.fn(),
    },
    message: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/host-response-summary", () => ({
  refreshHostResponseSummary: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(),
}));

import { GET, POST } from "@/app/api/conversations/route";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { refreshHostResponseSummary } from "@/lib/host-response-summary";

const transactionClient = {
  conversation: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  message: {
    create: vi.fn(),
  },
};

function runTransaction(callback: (tx: typeof transactionClient) => unknown) {
  return callback(transactionClient);
}

describe("/api/conversations collection route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1", role: "STUDENT" },
      expires: "2026-06-01T00:00:00.000Z",
    });
    vi.mocked(rateLimit).mockResolvedValue({
      ok: true,
      remaining: 19,
      resetAt: Date.now() + 60_000,
    });
    vi.mocked(db.$transaction).mockImplementation((async (callback: (tx: typeof transactionClient) => unknown) =>
      runTransaction(callback)) as typeof db.$transaction);
    transactionClient.conversation.findFirst.mockResolvedValue(null as never);
    transactionClient.conversation.create.mockResolvedValue({
      id: "conversation-1",
    } as never);
    transactionClient.conversation.update.mockResolvedValue({} as never);
    transactionClient.message.create.mockResolvedValue({ id: "message-1" } as never);
    vi.mocked(refreshHostResponseSummary).mockResolvedValue(undefined);
  });

  it("lists conversations for the current user", async () => {
    vi.mocked(db.conversation.findMany).mockResolvedValue([
      {
        id: "conversation-1",
        hostelName: "Old hostel name",
        hostel: { name: "Current hostel name" },
        messages: [],
        _count: { messages: 3 },
      },
    ] as Awaited<ReturnType<typeof db.conversation.findMany>>);
    vi.mocked(db.conversation.count).mockResolvedValue(1);

    const res = await GET(new NextRequest("https://hostello.test/api/conversations"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data[0]).toMatchObject({
      id: "conversation-1",
      hostelName: "Current hostel name",
      unreadCount: 3,
    });
    expect(body).toMatchObject({ total: 1, page: 1, limit: 20, hasMore: false });
  });

  it("filters unread/search on the server and caps pagination", async () => {
    vi.mocked(db.conversation.findMany).mockResolvedValue([]);
    vi.mocked(db.conversation.count).mockResolvedValue(100);

    const request = new NextRequest("https://hostello.test/api/conversations?page=2&limit=100&unread=true&search=Ali");
    const response = await GET(request);
    const body = await response.json();

    expect(db.conversation.findMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 50,
      take: 50,
      where: expect.objectContaining({
        participants: { some: { userId: "user-1" } },
        messages: { some: { read: false, senderId: { not: "user-1" } } },
        OR: expect.arrayContaining([
          { hostel: { name: { contains: "Ali", mode: "insensitive" } } },
          expect.objectContaining({ participants: expect.any(Object) }),
        ]),
      }),
    }));
    expect(body).toMatchObject({ total: 100, page: 2, limit: 50, hasMore: true });
  });

  it("accepts CUID hostel ids and snapshots hostelName on new conversations", async () => {
    vi.mocked(db.hostel.findUnique).mockResolvedValue({
      id: "clhostel000000000000000001",
      name: "Canal View Hostel",
      ownerId: "owner-1",
    } as Awaited<ReturnType<typeof db.hostel.findUnique>>);

    transactionClient.conversation.findFirst.mockResolvedValue(null as never);
    transactionClient.conversation.create.mockResolvedValue({
      id: "conversation-1",
    } as never);

    const req = new NextRequest("https://hostello.test/api/conversations", {
      method: "POST",
      body: JSON.stringify({
        hostelId: "clhostel000000000000000001",
        initialMessage: "Is a room available?",
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(db.hostel.findUnique).toHaveBeenCalledWith({
      where: { id: "clhostel000000000000000001", status: "ACTIVE" },
      select: { id: true, name: true, ownerId: true },
    });
    expect(transactionClient.conversation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          hostelId: "clhostel000000000000000001",
          hostelName: "Canal View Hostel",
          messages: {
            create: {
              senderId: "user-1",
              content: "Is a room available?",
            },
          },
        }),
      }),
    );
    expect(refreshHostResponseSummary).toHaveBeenCalledWith("owner-1", transactionClient);
    expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: "Serializable",
    });
  });

  it("appends_initial_message_to_existing_conversation", async () => {
    vi.mocked(db.hostel.findUnique).mockResolvedValue({
      id: "hostel-1",
      name: "Canal View Hostel",
      ownerId: "owner-1",
    } as Awaited<ReturnType<typeof db.hostel.findUnique>>);
    transactionClient.conversation.findFirst.mockResolvedValue({ id: "conversation-existing" } as never);

    const response = await POST(new NextRequest("https://hostello.test/api/conversations", {
      method: "POST",
      body: JSON.stringify({ hostelId: "hostel-1", initialMessage: "Is a room available?" }),
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { id: "conversation-existing" } });
    expect(transactionClient.message.create).toHaveBeenCalledWith({
      data: {
        conversationId: "conversation-existing",
        senderId: "user-1",
        content: "Is a room available?",
      },
    });
    expect(transactionClient.conversation.update).toHaveBeenCalled();
    expect(refreshHostResponseSummary).toHaveBeenCalledWith("owner-1", transactionClient);
  });

  it("creates_first_message_and_summary_atomically", async () => {
    vi.mocked(db.hostel.findUnique).mockResolvedValue({
      id: "hostel-1",
      name: "Canal View Hostel",
      ownerId: "owner-1",
    } as Awaited<ReturnType<typeof db.hostel.findUnique>>);

    const response = await POST(new NextRequest("https://hostello.test/api/conversations", {
      method: "POST",
      body: JSON.stringify({ hostelId: "hostel-1", initialMessage: "Is a room available?" }),
    }));

    expect(response.status).toBe(201);
    expect(transactionClient.conversation.create).toHaveBeenCalled();
    expect(refreshHostResponseSummary).toHaveBeenCalledWith("owner-1", transactionClient);
    expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: "Serializable",
    });
  });

  it("rolls_back_message_when_summary_refresh_fails", async () => {
    vi.mocked(db.hostel.findUnique).mockResolvedValue({
      id: "hostel-1",
      name: "Canal View Hostel",
      ownerId: "owner-1",
    } as Awaited<ReturnType<typeof db.hostel.findUnique>>);
    vi.mocked(refreshHostResponseSummary).mockRejectedValue(new Error("summary failed"));

    const response = await POST(new NextRequest("https://hostello.test/api/conversations", {
      method: "POST",
      body: JSON.stringify({ hostelId: "hostel-1", initialMessage: "Is a room available?" }),
    }));

    expect(response.status).toBe(500);
    expect(transactionClient.conversation.create).toHaveBeenCalled();
    expect(refreshHostResponseSummary).toHaveBeenCalledWith("owner-1", transactionClient);
    expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: "Serializable",
    });
  });

  it("rejects an oversized hostel ID before querying the database", async () => {
    const req = new NextRequest("https://hostello.test/api/conversations", {
      method: "POST",
      body: JSON.stringify({
        hostelId: "h".repeat(129),
        initialMessage: "Is a room available?",
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(db.hostel.findUnique).not.toHaveBeenCalled();
    expect(db.conversation.findFirst).not.toHaveBeenCalled();
    expect(transactionClient.conversation.create).not.toHaveBeenCalled();
  });

  it("does not start a conversation about a non-active hostel", async () => {
    vi.mocked(db.hostel.findUnique).mockResolvedValue(null);

    const req = new NextRequest("https://hostello.test/api/conversations", {
      method: "POST",
      body: JSON.stringify({
        hostelId: "clhostel000000000000000001",
        initialMessage: "Is a room available?",
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(404);
    expect(transactionClient.conversation.findFirst).not.toHaveBeenCalled();
    expect(transactionClient.conversation.create).not.toHaveBeenCalled();
  });

  it("does not allow non-students to start conversations", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "owner-2", role: "OWNER" },
      expires: "2026-06-01T00:00:00.000Z",
    } as any);

    const req = new NextRequest("https://hostello.test/api/conversations", {
      method: "POST",
      body: JSON.stringify({
        hostelId: "clhostel000000000000000001",
        initialMessage: "Is a room available?",
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(db.hostel.findUnique).not.toHaveBeenCalled();
    expect(transactionClient.conversation.create).not.toHaveBeenCalled();
  });
});
