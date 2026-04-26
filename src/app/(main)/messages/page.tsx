import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { MessageSquare } from "lucide-react";
import { formatDate, getInitials } from "@/lib/utils";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const session = await auth();
  if (!session) redirect("/login");

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
    },
  });

  // Get unread counts with a single aggregation query instead of N+1.
  // Groups messages by conversationId and counts unread messages per conversation.
  const unreadCounts = await db.message.groupBy({
    by: ["conversationId"],
    where: {
      conversationId: { in: conversations.map((c) => c.id) },
      read: false,
      senderId: { not: session.user.id },
    },
    _count: { id: true },
  });

  // Map the aggregated results into a lookup object for O(1) access.
  const unreadCountMap = new Map(
    unreadCounts.map((row) => [row.conversationId, row._count.id])
  );

  const conversationsWithUnread = conversations.map((conv) => ({
    ...conv,
    unreadCount: unreadCountMap.get(conv.id) ?? 0,
  }));

  return (
    <div className="min-h-screen pt-20 pb-16 bg-[var(--color-ground)]">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="py-10">
          <h1
            className="text-3xl sm:text-4xl font-extrabold text-[var(--color-ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Messages
          </h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
          </p>
        </div>

        {conversations.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border border-dashed border-[var(--color-border)]">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center mx-auto mb-5">
              <MessageSquare className="w-6 h-6 text-[var(--color-muted)]" />
            </div>
            <p className="text-base font-bold text-[var(--color-ink)] mb-1">No messages yet</p>
            <p className="text-sm text-[var(--color-muted)] mb-6">
              Contact hostel owners to start a conversation.
            </p>
            <Link
              href="/hostels"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-ink)] text-white text-sm font-bold hover:bg-[var(--color-ink-soft)] transition-colors"
            >
              Browse hostels
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {conversationsWithUnread.map((conv) => {
              const lastMessage = conv.messages[0];
              const isUnread = conv.unreadCount > 0;

              return (
                <Link
                  key={conv.id}
                  href={`/messages/${conv.id}`}
                  className="flex items-center gap-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 hover:border-[var(--color-ink)] transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-xl bg-[var(--color-ink)] text-white flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden">
                    {lastMessage?.sender.avatar ? (
                      <Image
                        src={lastMessage.sender.avatar}
                        alt={lastMessage.sender.name}
                        width={44}
                        height={44}
                        className="object-cover"
                      />
                    ) : (
                      getInitials(lastMessage?.sender.name ?? "?")
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`text-sm truncate ${isUnread ? "font-bold text-[var(--color-ink)]" : "font-semibold text-[var(--color-ink)]"}`}
                      >
                        {conv.hostelName}
                      </p>
                      <p className="text-xs text-[var(--color-muted)] flex-shrink-0">
                        {lastMessage ? formatDate(lastMessage.createdAt) : formatDate(conv.updatedAt)}
                      </p>
                    </div>
                    <p className={`text-xs mt-0.5 truncate ${isUnread ? "text-[var(--color-ink)] font-medium" : "text-[var(--color-muted)]"}`}>
                      {lastMessage
                        ? lastMessage.sender.id === session.user.id
                          ? `You: ${lastMessage.content}`
                          : lastMessage.content
                        : "No messages yet"}
                    </p>
                  </div>

                  {/* Unread badge */}
                  {isUnread && (
                    <div className="w-5 h-5 rounded-full bg-[var(--color-brand-500)] text-[var(--color-ink)] text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}