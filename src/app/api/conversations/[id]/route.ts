import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(2000),
});

/**
 * GET /api/conversations/[id]
 * Returns all messages in a conversation, marking unread ones as read.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const conversation = await db.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }

    if (!conversation.participantIds.includes(session.user.id) && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    // Mark unread messages from other participants as read
    await db.message.updateMany({
      where: {
        conversationId: id,
        read: false,
        senderId: { not: session.user.id },
      },
      data: { read: true },
    });

    return NextResponse.json({ data: conversation });
  } catch (err) {
    console.error("[GET /api/conversations/[id]]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

/**
 * POST /api/conversations/[id]
 * Sends a new message in a conversation.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: 30 messages per user per minute to prevent spam
    const rl = await rateLimit(`msg:${session.user.id}`, { limit: 30, windowMs: 60 * 1000 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many messages. Please slow down." },
        { status: 429 }
      );
    }

    const { id } = await params;

    const conversation = await db.conversation.findUnique({
      where: { id },
      select: { id: true, participantIds: true },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }

    if (!conversation.participantIds.includes(session.user.id)) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const body = await req.json();
    const parsed = messageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid message." },
        { status: 400 }
      );
    }

    const [message] = await db.$transaction([
      db.message.create({
        data: {
          conversationId: id,
          senderId: session.user.id,
          content: parsed.data.content,
        },
        include: {
          sender: { select: { id: true, name: true, avatar: true } },
        },
      }),
      db.conversation.update({
        where: { id },
        data: { updatedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ data: message }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/conversations/[id]]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}