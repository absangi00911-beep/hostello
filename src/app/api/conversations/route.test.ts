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
    },
    hostel: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(),
}));

import { GET, POST } from "@/app/api/conversations/route";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

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

    const res = await GET(new NextRequest("https://hostello.test/api/conversations"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data[0]).toMatchObject({
      id: "conversation-1",
      hostelName: "Current hostel name",
      unreadCount: 3,
    });
  });

  it("accepts CUID hostel ids and snapshots hostelName on new conversations", async () => {
    vi.mocked(db.hostel.findUnique).mockResolvedValue({
      id: "clhostel000000000000000001",
      name: "Canal View Hostel",
      ownerId: "owner-1",
    } as Awaited<ReturnType<typeof db.hostel.findUnique>>);

    const tx = {
      conversation: {
        create: vi.fn().mockResolvedValue({ id: "conversation-1" }),
        findFirst: vi.fn().mockResolvedValue(null),
        update: vi.fn(),
      },
      message: {
        create: vi.fn().mockResolvedValue({ id: "message-1" }),
      },
    };
    vi.mocked(db.$transaction).mockImplementation(async (callback) =>
      callback(tx as unknown as Parameters<Parameters<typeof db.$transaction>[0]>[0]),
    );

    const req = new NextRequest("https://hostello.test/api/conversations", {
      method: "POST",
      body: JSON.stringify({
        hostelId: "clhostel000000000000000001",
        initialMessage: "Is a room available?",
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(tx.conversation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          hostelId: "clhostel000000000000000001",
          hostelName: "Canal View Hostel",
        }),
      }),
    );
  });
});
