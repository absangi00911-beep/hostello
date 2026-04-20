"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";
import { formatDate, getInitials } from "@/lib/utils";
import Image from "next/image";

interface Message {
  id: string;
  content: string;
  createdAt: string | Date;
  read: boolean;
  sender: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

interface ConversationThreadProps {
  conversationId: string;
  currentUserId: string;
  hostelName: string;
  initialMessages?: Message[];
}

const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(2000),
});
type MessageInput = z.infer<typeof messageSchema>;

export function ConversationThread({
  conversationId,
  currentUserId,
  hostelName,
  initialMessages = [],
}: ConversationThreadProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [loading, setLoading] = useState(initialMessages.length === 0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<MessageInput>({
    resolver: zodResolver(messageSchema),
  });

  useEffect(() => {
    if (initialMessages.length === 0) {
      fetch(`/api/conversations/${conversationId}`)
        .then((r) => r.json())
        .then((json) => {
          if (json.data?.messages) setMessages(json.data.messages);
        })
        .catch(() => toast.error("Failed to load messages"))
        .finally(() => setLoading(false));
    }
  }, [conversationId, initialMessages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function onSubmit(data: MessageInput) {
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to send message");
      setMessages((prev) => [...prev, json.data]);
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--color-muted)]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--color-border)]">
        <p className="text-sm font-bold text-[var(--color-ink)]">{hostelName}</p>
        <p className="text-xs text-[var(--color-muted)]">{messages.length} messages</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)] text-center py-10">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender.id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div className="w-7 h-7 rounded-full bg-[var(--color-ink)] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden">
                  {msg.sender.avatar ? (
                    <Image
                      src={msg.sender.avatar}
                      alt={msg.sender.name}
                      width={28}
                      height={28}
                      className="object-cover"
                    />
                  ) : (
                    getInitials(msg.sender.name)
                  )}
                </div>

                {/* Bubble */}
                <div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isOwn
                        ? "bg-[var(--color-ink)] text-white rounded-br-sm"
                        : "bg-[var(--color-ground)] border border-[var(--color-border)] text-[var(--color-ink)] rounded-bl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <p className="text-xs text-[var(--color-muted)]">
                    {formatDate(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Compose */}
      <div className="px-5 py-4 border-t border-[var(--color-border)]">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex items-end gap-2"
          noValidate
        >
          <div className="flex-1">
            <textarea
              {...register("content")}
              rows={2}
              placeholder="Write a message…"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] text-sm resize-none outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20 transition-all"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(onSubmit)();
                }
              }}
            />
            {errors.content && (
              <p className="mt-1 text-xs text-red-600">{errors.content.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-10 w-10 rounded-xl bg-[var(--color-ink)] text-white flex items-center justify-center hover:bg-[var(--color-ink-soft)] disabled:opacity-50 transition-colors flex-shrink-0"
            aria-label="Send message"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
        <p className="text-xs text-[var(--color-muted)] mt-1.5">
          Press Enter to send, Shift+Enter for new line.
        </p>
      </div>
    </div>
  );
}