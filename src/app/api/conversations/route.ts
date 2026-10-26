import { getSafeErrorSummary } from "@/lib/safe-error";
// Path: src/app/api/conversations/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { parsePagination } from "@/lib/pagination";
import type { Prisma } from "@/generated/client";
import { z } from "zod";
import { readBoundedJson } from "@/lib/bounded-json";
import { refreshHostResponseSummary } from "@/lib/host-response-summary";

const MAX_MESSAGE_TRANSACTION_ATTEMPTS = 3;

function isSerializableTransactionConflict(error: unknown) {
  return error !== null &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "P2034";
}

const conversationSchema = z.object({
  hostelId: z.string().min(1, "Hostel ID is required").max(128, "Hostel ID is too long"),
  initialMessage: z.string().min(1, "Initial message is required").max(2000),
});

/**
 * GET /api/conversations
 * Lists all conversations for the current user.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await rateLimit(`list-conv:${session.user.id}`, {
      limit: 60,
      windowMs: 60 * 1000,
    });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }

    if (req.nextUrl.search.length > 1_024) {
      return NextResponse.json({ error: "Query is too long." }, { status: 400 });
    }
    const search = (req.nextUrl.searchParams.get("search") ?? "").trim();
    const unreadParam = req.nextUrl.searchParams.get("unread");
    if (search.length > 100 || (unreadParam !== null && unreadParam !== "true" && unreadParam !== "false")) {
      return NextResponse.json({ error: "Invalid conversation filters." }, { status: 400 });
    }
    const unreadOnly = unreadParam === "true";
    const { page, limit, skip } = parsePagination(req.nextUrl.searchParams, {
      defaultLimit: 20,
      maxLimit: 50,
    });
    const where: Prisma.ConversationWhereInput = {
      participants: { some: { userId: session.user.id } },
      ...(unreadOnly && {
        messages: { some: { read: false, senderId: { not: session.user.id } } },
      }),
      ...(search && {
        OR: [
          { hostel: { name: { contains: search, mode: "insensitive" } } },
          {
            participants: {
              some: {
                userId: { not: session.user.id },
                user: { name: { contains: search, mode: "insensitive" } },
              },
            },
          },
        ],
      }),
    };

    const [conversations, total] = await Promise.all([db.conversation.findMany({
      where,
      skip,
      take: limit,
      include: {
        hostel: {
          select: { name: true, slug: true, coverImage: true },
        },
        participants: {
          select: {
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                role: true,
                studentVerified: true,
              },
            },
          },
        },
        messages: {
          select: { content: true, read: true, senderId: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: {
            messages: { where: { read: false, senderId: { not: session.user.id } } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }), db.conversation.count({ where })]);

    const data = conversations.map((conv) => {
      return {
        id: conv.id,
        hostelName: conv.hostel.name,
        hostel: conv.hostel,
        participants: conv.participants ?? [],
        messages: conv.messages ?? [],
        unreadCount: conv._count.messages,
        updatedAt: conv.updatedAt,
      };
    });

    return NextResponse.json({
      data,
      total,
      page,
      limit,
      hasMore: skip + conversations.length < total,
    });
  } catch (err) {
    console.error("[GET /api/conversations]", getSafeErrorSummary(err));
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

/**
 * POST /api/conversations
 * Creates a new conversation (starts a new message thread with a hostel owner).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Only students can start conversations with hostel owners." }, { status: 403 });
    }

    const rl = await rateLimit(`create-conv:${session.user.id}`, {
      limit: 10,
      windowMs: 60 * 1000,
    });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many conversation creation attempts. Please slow down." },
        { status: 429 }
      );
    }

    const body = await readBoundedJson(req, 4_096);
    if (!body.ok) {
      return NextResponse.json({ error: body.error }, { status: body.status });
    }
    const parsed = conversationSchema.safeParse(body.data);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request." },
        { status: 400 }
      );
    }

    const { hostelId, initialMessage } = parsed.data;

    // Verify hostel exists and get its owner
    const hostel = await db.hostel.findUnique({
      where: { id: hostelId, status: "ACTIVE" },
      select: { id: true, name: true, ownerId: true },
    });

    if (!hostel) {
      return NextResponse.json({ error: "Hostel not found." }, { status: 404 });
    }

    // Prevent hostel owners from messaging themselves
    if (hostel.ownerId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot message yourself." },
        { status: 400 }
      );
    }

    let result: { id: string; created: boolean } | undefined;
    for (let attempt = 0; attempt < MAX_MESSAGE_TRANSACTION_ATTEMPTS; attempt++) {
      try {
        result = await db.$transaction(async (tx) => {
          const existingConversation = await tx.conversation.findFirst({
            where: {
              hostelId,
              participants: { some: { userId: session.user.id } },
            },
            select: { id: true },
          });

          if (existingConversation) {
            await tx.message.create({
              data: {
                conversationId: existingConversation.id,
                senderId: session.user.id,
                content: initialMessage,
              },
            });
            await tx.conversation.update({
              where: { id: existingConversation.id },
              data: { updatedAt: new Date() },
            });
            await refreshHostResponseSummary(hostel.ownerId, tx);
            return { id: existingConversation.id, created: false };
          }

          const conversation = await tx.conversation.create({
            data: {
              hostelId,
              hostelName: hostel.name,
              participants: {
                createMany: {
                  data: [
                    { userId: session.user.id },
                    { userId: hostel.ownerId },
                  ],
                },
              },
              messages: {
                create: {
                  senderId: session.user.id,
                  content: initialMessage,
                },
              },
            },
            select: { id: true },
          });
          await refreshHostResponseSummary(hostel.ownerId, tx);
          return { id: conversation.id, created: true };
        }, { isolationLevel: "Serializable" });
        break;
      } catch (error) {
        if (!isSerializableTransactionConflict(error) || attempt + 1 === MAX_MESSAGE_TRANSACTION_ATTEMPTS) {
          throw error;
        }
      }
    }

    if (!result) throw new Error("Conversation transaction did not return a result.");
    return NextResponse.json(
      { data: { id: result.id } },
      { status: result.created ? 201 : 200 },
    );
  } catch (err) {
    console.error("[POST /api/conversations]", getSafeErrorSummary(err));
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
