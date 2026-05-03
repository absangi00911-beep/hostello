"use client";

import { useState } from "react";
import styles from "./message-input.module.css";

interface MessageInputProps {
  conversationId: string;
  onMessageSent: () => void;
}

export default function MessageInput({
  conversationId,
  onMessageSent,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/conversations/${conversationId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: content.trim() }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to send message");
        setLoading(false);
        return;
      }

      setContent("");
      onMessageSent();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {error && <div className={styles.error}>{error}</div>}
      <form onSubmit={handleSubmit} className={styles.form}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type your message..."
          rows={3}
          className={styles.input}
          disabled={loading}
        />
        <button
          type="submit"
          className={styles.button}
          disabled={loading || !content.trim()}
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
