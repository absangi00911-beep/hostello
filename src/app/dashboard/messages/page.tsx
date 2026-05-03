import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import styles from "./messages.module.css";
import ConversationList from "@/components/features/dashboard/conversation-list";

export const metadata = {
  title: "Messages - Dashboard",
};

export default async function MessagesPage() {
  const session = await auth();
  const userId = session?.user?.id!;

  // Get conversations for owner's hostels
  const conversations = await db.conversation.findMany({
    where: {
      hostel: { ownerId: userId },
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
      },
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
      },
      hostel: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className={styles.messages}>
      <div className={styles.header}>
        <h1>Messages</h1>
        <p className={styles.subtitle}>Chat with guests about their stay</p>
      </div>

      {conversations.length === 0 ? (
        <div className={styles.emptyState}>
          <h2>No messages yet</h2>
          <p>Guests will be able to message you once they book your hostel</p>
        </div>
      ) : (
        <ConversationList conversations={conversations} currentUserId={userId} />
      )}
    </div>
  );
}
