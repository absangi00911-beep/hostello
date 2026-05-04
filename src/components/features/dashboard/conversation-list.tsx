import Link from "next/link";
import Image from "next/image";
import { Conversation, ConversationParticipant, Message } from "@prisma/client";
import styles from "./conversation-list.module.css";

interface ConversationListProps {
  conversations: (Conversation & {
    participants: (ConversationParticipant & {
      user: { id: string; name: string; avatar: string | null };
    })[];
    messages: Message[];
    hostel: { name: string };
  })[];
  currentUserId: string;
}

export default function ConversationList({
  conversations,
  currentUserId,
}: ConversationListProps) {
  return (
    <div className={styles.conversationList}>
      {conversations.map((conversation) => {
        const otherParticipant = conversation.participants.find(
          (p) => p.userId !== currentUserId
        )?.user;
        const lastMessage = conversation.messages[0];
        const preview = lastMessage?.content.substring(0, 80) || "No messages yet";

        return (
          <Link
            key={conversation.id}
            href={`/dashboard/messages/${conversation.id}`}
            className={styles.conversationItem}
          >
            <div className={styles.avatar}>
              {otherParticipant?.avatar ? (
                <Image
                  src={otherParticipant.avatar}
                  alt={otherParticipant.name}
                  width={48}
                  height={48}
                  className={styles.avatarImg}
                />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {otherParticipant?.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className={styles.content}>
              <div className={styles.header}>
                <h3 className={styles.name}>{otherParticipant?.name}</h3>
                <span className={styles.time}>
                  {lastMessage && new Date(lastMessage.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className={styles.hostel}>{conversation.hostel.name}</p>
              <p className={styles.preview}>{preview}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
