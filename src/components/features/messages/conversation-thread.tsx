"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Send, Loader2, RefreshCw } from "lucide-react";
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

/** Initial poll interval when connection is healthy */
const POLL_INTERVAL_MIN_MS = 30000;

/** Max backoff on repeated errors to avoid hammering during outages */
const POLL_INTERVAL_MAX_MS = 60000;

export function ConversationThread({
  conversationId,
  currentUserId,
  hostelName,
  initialMessages = [],
}: ConversationThreadProps) {
  const [messages, setMessages]       = useState<Message[]>(initialMessages);
  const [loading, setLoading]         = useState(initialMessages.length === 0);
  const [pollingError, setPollingError] = useState(false);
  const [pollInterval, setPollInterval] = useState(POLL_INTERVAL_MIN_MS);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const lastIdRef  = useRef<string | undefined>(messages.at(-1)?.id);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch all messages (initial load) ────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    try {
      const res  = await fetch(`/api/conversations/${conversationId}`);
      const json = await res.json();
      if (json.data?.messages) {
        setMessages(json.data.messages);
        lastIdRef.current = json.data.messages.at(-1)?.id;
        setPollingError(false);
        // Reset to fast polling on successful response
        setPollInterval(POLL_INTERVAL_MIN_MS);
      }
    } catch {
      setPollingError(true);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // Initial load if no messages passed from server
  useEffect(() => {
    if (initialMessages.length === 0) {
      fetchMessages();
    }
  }, [fetchMessages, initialMessages.length]);

  // ── Polling with exponential backoff ───────────────────────────────────────
  // Uses useRef for interval to avoid race conditions when pollInterval changes.
  // Without this, each pollInterval state update would clear and re-create the
  // interval, creating a brief window where two intervals run simultaneously.
  useEffect(() => {
    function poll() {
      // Only poll when the tab is visible to avoid wasted requests
      if (document.visibilityState !== "visible") return;

      (async () => {
        try {
          const res  = await fetch(`/api/conversations/${conversationId}`);
          const json = await res.json();
          if (!res.ok || !json.data?.messages) {
            // Server error — increase backoff
            setPollInterval((prev) =>
              Math.min(prev * 1.5, POLL_INTERVAL_MAX_MS)
            );
            setPollingError(true);
            return;
          }

          const incoming: Message[] = json.data.messages;
          const newLastId = incoming.at(-1)?.id;

          // Only update state if there are genuinely new messages
          if (newLastId && newLastId !== lastIdRef.current) {
            setMessages(incoming);
            lastIdRef.current = newLastId;
          }

          // Successful poll — reset backoff
          setPollingError(false);
          setPollInterval(POLL_INTERVAL_MIN_MS);
        } catch {
          // Network error — increase backoff
          setPollInterval((prev) =>
            Math.min(prev * 1.5, POLL_INTERVAL_MAX_MS)
          );
          setPollingError(true);
        }
      })();
    }

    // Update the interval when pollInterval changes without re-running the effect.
    // This avoids the race condition from clearing and re-creating the interval.
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(poll, pollInterval);

    // Pause/resume polling based on tab visibility
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        // Immediately fetch when the tab comes back into view
        fetchMessages();
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [conversationId, fetchMessages, pollInterval]);

  // ── Auto-scroll on new messages ───────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send message ──────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<MessageInput>({
    resolver: zodResolver(messageSchema),
  });

  async function onSubmit(data: MessageInput) {
    try {
      const res  = await fetch(`/api/conversations/${conversationId}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to send message");

      // Optimistically append before the next poll cycle
      setMessages((prev) => [...prev, json.data]);
      lastIdRef.current = json.data.id;
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
      <div className="px-6 py-5 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-brand-50)]">
        <div>
          <p className="text-base font-bold text-[var(--color-ink)]">{hostelName}</p>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1 font-medium">{messages.length} message{messages.length !== 1 ? "s" : ""}</p>
        </div>

        {pollingError && (
          <button
            onClick={fetchMessages}
            className="flex items-center gap-1.5 text-base text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] transition-colors font-semibold"
            title="Refresh messages"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        )}
      </div>

      {/* Polling status indicator */}
      {pollingError && (
        <div className="px-6 py-3 bg-amber-50 border-b border-amber-100">
          <p className="text-sm text-amber-700 font-medium">
            Connection issue — messages may be delayed.{" "}
            <button onClick={fetchMessages} className="font-bold underline hover:no-underline">
              Retry
            </button>
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {messages.length === 0 ? (
          <p className="text-base text-[var(--color-ink-muted)] text-center py-12 font-medium">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender.id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-3 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-600)] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden">
                  {msg.sender.avatar ? (
                    <Image
                      src={msg.sender.avatar}
                      alt={msg.sender.name}
                      width={32}
                      height={32}
                      className="object-cover"
                    />
                  ) : (
                    getInitials(msg.sender.name)
                  )}
                </div>

                {/* Bubble */}
                <div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"} flex flex-col gap-1.5`}>
                  <div
                    className={`px-5 py-3 rounded-lg text-base leading-relaxed ${
                      isOwn
                        ? "bg-[var(--color-brand-600)] text-white rounded-br-none"
                        : "bg-[var(--color-ground)] border border-[var(--color-border)] text-[var(--color-ink)] rounded-bl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <p className="text-sm text-[var(--color-ink-muted)] font-medium">
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
      <div className="px-6 py-5 border-t border-[var(--color-border)] bg-[var(--color-brand-50)]">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex items-end gap-3"
          noValidate
        >
          <div className="flex-1">
            <textarea
              {...register("content")}
              rows={2}
              placeholder="Write a message…"
              className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] text-base resize-none outline-none focus:border-[var(--color-brand-600)] focus:ring-2 focus:ring-[var(--color-brand-600)]/20 transition-all"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(onSubmit)();
                }
              }}
            />
            {errors.content && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.content.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-11 rounded-lg bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white flex items-center justify-center disabled:opacity-50 transition-colors flex-shrink-0 font-bold"
            aria-label="Send message"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
        <p className="text-sm text-[var(--color-ink-muted)] mt-2 font-medium">
          Press Enter to send · Shift+Enter for new line · Updates every {POLL_INTERVAL_MIN_MS / 1000}s
        </p>
      </div>
    </div>
  );
}