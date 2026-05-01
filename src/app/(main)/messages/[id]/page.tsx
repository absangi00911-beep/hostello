import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { ConversationThread } from "@/components/features/messages/conversation-thread";

export const metadata: Metadata = { title: "Conversation" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ConversationPage({ params }: PageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const conversation = await db.conversation.findUnique({
    where: { id },
    include: {
      hostel: { select: { name: true } }, // Get current hostel name instead of stale snapshot
      participants: {
        select: { userId: true },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender: { select: { id: true, name: true, avatar: true } },
        },
      },
    },
  });

  if (!conversation) notFound();

  const userIds = conversation.participants.map((p) => p.userId);
  if (
    !userIds.includes(session.user.id) &&
    session.user.role !== "ADMIN"
  ) {
    notFound();
  }

  // Mark messages as read server-side on first load
  await db.message.updateMany({
    where: {
      conversationId: id,
      read: false,
      senderId: { not: session.user.id },
    },
    data: { read: true },
  });

  return (
    <div className="min-h-screen pt-20 pb-0 bg-[var(--color-ground)] flex flex-col">
      <div className="mx-auto max-w-2xl w-full px-4 sm:px-6 lg:px-8 flex-1 flex flex-col">
        {/* Back link */}
        <div className="py-4">
          <Link
            href="/messages"
            className="text-sm font-semibold text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
          >
            ← Messages
          </Link>
        </div>

        {/* Thread */}
        <div className="flex-1 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden flex flex-col mb-6">
          <ConversationThread
            conversationId={conversation.id}
            currentUserId={session.user.id}
            hostelName={(conversation.hostel as any)?.name ?? conversation.hostelName}
            initialMessages={conversation.messages.map((m) => ({
              ...m,
              createdAt: m.createdAt.toISOString(),
            }))}
          />
        </div>
      </div>
    </div>
  );
}