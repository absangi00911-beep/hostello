import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  hostelId: z.string().cuid(),
  initialMessage: z.string().min(1, "Message cannot be empty").max(2000),
});

/**
 * GET /api/conversations
 * Returns all conversations for the current user.
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversations = await db.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: session.user.id,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: { select: { id: true, name: true, avatar: true } },
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                read: false,
                senderId: { not: session.user.id },
              },
            },
          },
        },
      },
    });

    // Transform response to include unreadCount
    const withUnread = conversations.map((conv) => ({
      ...conv,
      unreadCount: conv._count.messages,
      _count: undefined, // remove internal _count field
    }));

    return NextResponse.json({ data: withUnread });
  } catch (err) {
    console.error("[GET /api/conversations]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

/**
 * POST /api/conversations
 * Creates a new conversation between the current user and a hostel owner,
 * or returns the existing one.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid request." },
        { status: 400 }
      );
    }

    const { hostelId, initialMessage } = parsed.data;

    const hostel = await db.hostel.findUnique({
      where: { id: hostelId, status: "ACTIVE" },
      select: { id: true, name: true, ownerId: true },
    });

    if (!hostel) {
      return NextResponse.json({ error: "Hostel not found." }, { status: 404 });
    }

    if (hostel.ownerId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot message yourself." },
        { status: 400 }
      );
    }

    const participantIds = [session.user.id, hostel.ownerId].sort();

    // Wrap the entire check + create in a transaction to prevent race conditions
    const result = await db.$transaction(async (tx) => {
      // Check if a conversation already exists between these participants for this hostel
      const existing = await tx.conversation.findFirst({
        where: {
          hostelId,
          participants: {
            every: {
              userId: { in: participantIds },
            },
          },
        },
        include: {
          _count: {
            select: {
              participants: true,
            },
          },
        },
      });

      // Verify it has exactly 2 participants (no extra participants)
      if (existing && existing._count.participants === 2) {
        // Add the new message to the existing conversation
        const message = await tx.message.create({
          data: {
            conversationId: existing.id,
            senderId: session.user.id,
            content: initialMessage,
          },
          include: {
            sender: { select: { id: true, name: true, avatar: true } },
          },
        });

        await tx.conversation.update({
          where: { id: existing.id },
          data: { updatedAt: new Date() },
        });

        return { conversation: existing, message, isNew: false };
      }

      // Create new conversation with initial message
      const conversation = await tx.conversation.create({
        data: {
          hostelId,
          hostelName: hostel.name,
          participants: {
            create: participantIds.map((userId) => ({ userId })),
          },
        },
      });

      const message = await tx.message.create({
        data: {
          conversationId: conversation.id,
          senderId: session.user.id,
          content: initialMessage,
        },
        include: {
          sender: { select: { id: true, name: true, avatar: true } },
        },
      });

      return { conversation, message, isNew: true };
    });

    return NextResponse.json(
      { data: result, isNew: result.isNew },
      { status: result.isNew ? 201 : 200 }
    );
  } catch (err) {
    console.error("[POST /api/conversations]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}