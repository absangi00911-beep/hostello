"use client";

import { format } from "date-fns";
import styles from "./message-list.module.css";

interface MessageListProps {
  messages: {
    id: string;
    content: string;
    userId: string;
    createdAt: string;
    user: { id: string; name: string; avatar: string | null };
  }[];
  currentUserId: string;
}

export default function MessageList({
  messages,
  currentUserId,
}: MessageListProps) {
  // Group messages by date
  const groupedMessages = messages.reduce(
    (acc, msg) => {
      const date = format(new Date(msg.createdAt), "yyyy-MM-dd");
      if (!acc[date]) acc[date] = [];
      acc[date].push(msg);
      return acc;
    },
    {} as Record<string, typeof messages>
  );

  return (
    <div className={styles.container}>
      {messages.length === 0 ? (
        <div className={styles.empty}>
          <p>No messages yet. Start a conversation!</p>
        </div>
      ) : (
        Object.entries(groupedMessages).map(([date, dayMessages]) => (
          <div key={date}>
            {/* Date Separator */}
            <div className={styles.dateSeparator}>
              <span>{format(new Date(date), "MMM d, yyyy")}</span>
            </div>

            {/* Messages for this date */}
            <div className={styles.messages}>
              {dayMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`${styles.message} ${
                    msg.userId === currentUserId
                      ? styles.own
                      : styles.other
                  }`}
                >
                  {msg.userId !== currentUserId && (
                    <img
                      src={msg.user.avatar || "/avatar-placeholder.png"}
                      alt={msg.user.name}
                      className={styles.avatar}
                    />
                  )}

                  <div className={styles.content}>
                    {msg.userId !== currentUserId && (
                      <p className={styles.sender}>{msg.user.name}</p>
                    )}
                    <div className={styles.bubble}>{msg.content}</div>
                    <p className={styles.timestamp}>
                      {format(new Date(msg.createdAt), "HH:mm")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
