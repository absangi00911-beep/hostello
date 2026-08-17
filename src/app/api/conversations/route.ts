// Path: src/app/api/conversations/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const conversationSchema = z.object({
  hostelId: z.string().min(1, "Hostel ID is required"),
  initialMessage: z.string().min(1, "Initial message is required").max(2000),
});

/**
 * GET /api/conversations
 * Lists all conversations for the current user.
 */
export async function GET(_req: NextRequest) {
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

    const conversations = await db.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: {
        hostel: {
          select: { name: true },
        },
        messages: {
          select: { id: true, read: true, senderId: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const data = conversations.map((conv) => {
      const unreadCount = conv.messages.filter(
        (msg) => !msg.read && msg.senderId !== session.user.id
      ).length;

      return {
        id: conv.id,
        hostelName: conv.hostel.name,
        unreadCount,
        updatedAt: conv.updatedAt,
      };
    });

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[GET /api/conversations]", err);
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

    const body = await req.json();
    const parsed = conversationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid request." },
        { status: 400 }
      );
    }

    const { hostelId, initialMessage } = parsed.data;

    // Verify hostel exists and get its owner
    const hostel = await db.hostel.findUnique({
      where: { id: hostelId },
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

    // Check if conversation already exists
    const existingConversation = await db.conversation.findFirst({
      where: {
        hostelId,
        participants: {
          some: {
            userId: session.user.id,
          },
        },
      },
      select: { id: true },
    });

    if (existingConversation) {
      // Conversation already exists, just return it
      return NextResponse.json({ data: { id: existingConversation.id } }, { status: 200 });
    }

    // Create new conversation
    const conversation = await db.conversation.create({
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

    return NextResponse.json({ data: { id: conversation.id } }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/conversations]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
