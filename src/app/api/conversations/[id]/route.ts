import { getSafeErrorSummary } from "@/lib/safe-error";
// Path: src/app/api/conversations/[id]/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notifications";
import { z } from "zod";
import { readBoundedJson } from "@/lib/bounded-json";
import { parsePagination } from "@/lib/pagination";
import { isBoundedRouteParam } from "@/lib/route-params";

const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(2000),
});

/**
 * GET /api/conversations/[id]
 * Returns all messages in a conversation, marking unread ones as read.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await rateLimit(`list-msg:${session.user.id}`, {
      limit: 120,
      windowMs: 60 * 1000,
    });
    if (!rl.ok) return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });

    if (req.nextUrl.search.length > 1_024) {
      return NextResponse.json({ error: "Query is too long." }, { status: 400 });
    }
    const { page, limit, skip } = parsePagination(req.nextUrl.searchParams, {
      defaultLimit: 50,
      maxLimit: 100,
    });

    const { id } = await params;
    if (!isBoundedRouteParam(id)) {
      return NextResponse.json({ error: "Invalid conversation." }, { status: 400 });
    }

    const conversation = await db.conversation.findFirst({
      where: { id, participants: { some: { userId: session.user.id } } },
      include: {
        hostel: { select: { name: true, slug: true, coverImage: true } },
        participants: {
          select: {
            userId: true,
            user: {
              select: { id: true, name: true, avatar: true, role: true, studentVerified: true },
            },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }

    const userIds = conversation.participants.map((p) => p.userId);
    if (!userIds.includes(session.user.id)) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const messageWhere = { conversationId: id };
    const [messagesDesc, messageTotal] = await Promise.all([
      db.message.findMany({
        where: messageWhere,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip,
        take: limit,
        include: { sender: { select: { id: true, name: true, avatar: true } } },
      }),
      db.message.count({ where: messageWhere }),
    ]);

    // Most relevant booking between these two people at this hostel, for the
    // context card in the thread header. Best-effort: a conversation can
    // exist without a booking (e.g. a pre-booking question), so this is
    // allowed to come back null rather than failing the whole request.
    const otherUserId = userIds.find((uid) => uid !== session.user.id);
    const booking = otherUserId
      ? await db.booking.findFirst({
          where: {
            hostelId: conversation.hostelId,
            userId: otherUserId,
            status: { not: "CANCELLED" },
          },
          orderBy: { createdAt: "desc" },
          select: { checkIn: true, checkOut: true, months: true, status: true },
        })
      : null;

    // Mark unread messages from other participants as read
    await db.message.updateMany({
      where: {
        conversationId: id,
        read: false,
        senderId: { not: session.user.id },
      },
      data: { read: true },
    });

    return NextResponse.json({
      data: {
        ...conversation,
        messages: messagesDesc.reverse(),
        booking,
        messageTotal,
        messagePage: page,
        messageLimit: limit,
        messageHasMore: skip + messagesDesc.length < messageTotal,
      },
    });
  } catch (err) {
    console.error("[GET /api/conversations/[id]]", getSafeErrorSummary(err));
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

/**
 * POST /api/conversations/[id]
 * Sends a new message in a conversation and notifies the recipient.
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
    const rl = await rateLimit(`msg:${session.user.id}`, {
      limit: 30,
      windowMs: 60 * 1000,
    });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many messages. Please slow down." },
        { status: 429 }
      );
    }

    const { id } = await params;
    if (!isBoundedRouteParam(id)) {
      return NextResponse.json({ error: "Invalid conversation." }, { status: 400 });
    }

    // Fetch hostelId alongside participants so the notification can link
    // directly to the hostel the conversation is about.
    const conversation = await db.conversation.findFirst({
      where: { id, participants: { some: { userId: session.user.id } } },
      select: {
        id: true,
        hostelId: true,
        participants: {
          select: { userId: true },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }

    const userIds = conversation.participants.map((p) => p.userId);
    if (!userIds.includes(session.user.id)) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const body = await readBoundedJson(req, 4_096);
    if (!body.ok) {
      return NextResponse.json({ error: body.error }, { status: body.status });
    }
    const parsed = messageSchema.safeParse(body.data);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid message." },
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

    // -- Notify recipient(s) ------------------------------------------------
    // Find every participant who is NOT the sender and notify them.
    // In practice conversations are always 2-person (student + owner) but
    // iterating guards against any future expansion.
    //
    // Fire-and-forget: a notification failure must never fail the message send.
    const recipientIds = userIds.filter((uid) => uid !== session.user.id);

    // Truncate the message preview to keep notification text readable.
    const preview =
      parsed.data.content.length > 100
        ? `${parsed.data.content.slice(0, 100)}…`
        : parsed.data.content;

    for (const recipientId of recipientIds) {
      void createNotification({
        userId:   recipientId,
        type:     "MESSAGE_RECEIVED",
        title:    message.sender.name,   // sender name as title (messaging app convention)
        message:  preview,
        hostelId: conversation.hostelId, // lets the UI deep-link to the right hostel
        conversationId: id,             // push-only context for the mobile tap route
      }).catch((err) =>
        console.error(
          "[conversations] Notification delivery failed:",
          getSafeErrorSummary(err),
        )
      );
    }

    return NextResponse.json({ data: message }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/conversations/[id]]", getSafeErrorSummary(err));
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
