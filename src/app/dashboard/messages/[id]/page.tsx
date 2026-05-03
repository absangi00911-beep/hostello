"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import MessageList from "@/components/features/dashboard/message-list";
import MessageInput from "@/components/features/dashboard/message-input";
import styles from "./conversation.module.css";

interface Conversation {
  id: string;
  hostel: { id: string; name: string };
  participants: { id: string; name: string; avatar: string | null }[];
  messages: {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
    sender: { id: string; name: string; avatar: string | null };
  }[];
}

export default function ConversationPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = params.id as string;

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");

  // Fetch conversation and messages
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const res = await fetch(`/api/conversations/${conversationId}`);
        if (!res.ok) {
          if (res.status === 404) {
            router.push("/dashboard/messages");
            return;
          }
          throw new Error("Failed to load conversation");
        }

        const data = await res.json();
        setConversation(data.data);
        setCurrentUserId(data.data?.participants?.[0]?.id || "");

        setError("");
      } catch (err: any) {
        setError(err.message || "Failed to load conversation");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [conversationId, router]);

  // Poll for new messages every 2 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/conversations/${conversationId}`);
        if (res.ok) {
          const data = await res.json();
          setConversation(data.data);
        }
      } catch (err) {
        console.error("Failed to poll messages:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [conversationId]);

  const handleMessageSent = async () => {
    // Immediately fetch new messages
    try {
      const res = await fetch(`/api/conversations/${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setConversation(data.data);
      }
    } catch (err) {
      console.error("Failed to refresh messages:", err);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading conversation...</div>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error || "Conversation not found"}</div>
      </div>
    );
  }

  // Find the other participant
  const otherParticipant = conversation.participants.find(
    (p) => p.id !== currentUserId
  );

  // Transform messages to match MessageList props
  const transformedMessages = conversation.messages.map((msg) => ({
    ...msg,
    userId: msg.senderId,
    user: msg.sender,
  }));

  return (
    <main className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button
          onClick={() => router.back()}
          className={styles.backButton}
          title="Go back"
        >
          ←
        </button>
        <div className={styles.info}>
          <h1 className={styles.title}>
            {otherParticipant?.name || "Guest"}
          </h1>
          <p className={styles.hostel}>{conversation.hostel.name}</p>
        </div>
      </div>

      {/* Messages */}
      <div className={styles.messagesContainer}>
        <MessageList messages={transformedMessages} currentUserId={currentUserId} />
      </div>

      {/* Message Input */}
      <MessageInput
        conversationId={conversationId}
        onMessageSent={handleMessageSent}
      />
    </main>
  );
}
