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
      hostel: { select: { name: true } }, // Get current hostel name instead of stale snapshot
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
        <div className="py-12">
          <h1
            className="text-4xl sm:text-5xl font-extrabold text-[var(--color-ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Messages
          </h1>
          <p className="text-base text-[var(--color-ink-muted)] mt-2 font-medium">
            {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
          </p>
        </div>

        {conversations.length === 0 ? (
          <div className="py-24 text-center rounded-lg border border-dashed border-[var(--color-border)]">
            <div className="w-14 h-14 rounded-lg bg-[var(--color-brand-50)] border border-[var(--color-brand-100)] flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="w-6 h-6 text-[var(--color-brand-600)]" />
            </div>
            <p className="text-lg font-bold text-[var(--color-ink)] mb-2">No messages yet</p>
            <p className="text-base text-[var(--color-ink-muted)] mb-8">
              Contact hostel owners to start a conversation.
            </p>
            <Link
              href="/hostels"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white text-base font-bold transition-colors"
            >
              Browse hostels
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {conversationsWithUnread.map((conv) => {
              const lastMessage = conv.messages[0];
              const isUnread = conv.unreadCount > 0;
              // Use current hostel name from join, fallback to snapshot if needed
              const displayHostelName = (conv.hostel as any)?.name ?? conv.hostelName;

              return (
                <Link
                  key={conv.id}
                  href={`/messages/${conv.id}`}
                  className="flex items-center gap-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] p-5 hover:border-[var(--color-brand-500)] hover:shadow-card transition-all"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-lg bg-[var(--color-brand-600)] text-white flex items-center justify-center text-base font-bold flex-shrink-0 overflow-hidden">
                    {lastMessage?.sender.avatar ? (
                      <Image
                        src={lastMessage.sender.avatar}
                        alt={lastMessage.sender.name}
                        width={48}
                        height={48}
                        className="object-cover"
                      />
                    ) : (
                      getInitials(lastMessage?.sender.name ?? "?")
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p
                        className={`text-base truncate ${isUnread ? "font-bold text-[var(--color-ink)]" : "font-semibold text-[var(--color-ink)]"}`}
                      >
                        {displayHostelName}
                      </p>
                      <p className="text-sm text-[var(--color-ink-muted)] flex-shrink-0 font-medium">
                        {lastMessage ? formatDate(lastMessage.createdAt) : formatDate(conv.updatedAt)}
                      </p>
                    </div>
                    <p className={`text-sm truncate ${isUnread ? "text-[var(--color-ink)] font-semibold" : "text-[var(--color-ink-muted)]"}`}>
                      {lastMessage
                        ? lastMessage.sender.id === session.user.id
                          ? `You: ${lastMessage.content}`
                          : lastMessage.content
                        : "No messages yet"}
                    </p>
                  </div>

                  {/* Unread badge */}
                  {isUnread && (
                    <div className="w-6 h-6 rounded-full bg-[var(--color-brand-600)] text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
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