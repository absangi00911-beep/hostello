// Path: src/app/dashboard/messages/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Send,
  MessageCircle,
  ChevronLeft,
  Building2,
  Loader2,
} from "lucide-react";
import { PageSpinner, InlineError, EmptyState } from "@/components/ui/shared";

/* -- Types ------------------------------------------------- */
interface Conversation {
  id: string;
  hostelName: string;
  hostelId: string;
  updatedAt: string;
  participants: { userId: string; user: { id: string; name: string; avatar?: string | null } }[];
  messages: { content: string; senderId: string; read: boolean; createdAt: string }[];
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

/* -- User avatar ------------------------------------------- */
function Avatar({ name, avatar, size = 36 }: { name: string; avatar?: string | null; size?: number }) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div
      className="shrink-0 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center overflow-hidden"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {avatar ? (
        <img src={avatar} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="text-[var(--color-primary-deep)] font-[600] select-none" style={{ fontSize: size * 0.38 }}>
          {initials}
        </span>
      )}
    </div>
  );
}

/* -- Conversation list item -------------------------------- */
function ConversationItem({
  convo,
  currentUserId,
  isActive,
  onClick,
}: {
  convo: Conversation;
  currentUserId: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const lastMsg    = convo.messages[convo.messages.length - 1];
  const hasUnread  = convo.messages.some((m) => !m.read && m.senderId !== currentUserId);
  const otherUser  = convo.participants.find((p) => p.userId !== currentUserId)?.user;
  const timeAgo    = formatDistanceToNow(new Date(convo.updatedAt), { addSuffix: false });

  return (
    <button
      onClick={onClick}
      aria-current={isActive ? "true" : undefined}
      className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors duration-[var(--transition-fast)] border-b border-[var(--color-border-subtle)] last:border-b-0 ${
        isActive
          ? "bg-[var(--color-primary-faint)]"
          : "hover:bg-[var(--color-bg-overlay)]"
      }`}
    >
      <Avatar name={otherUser?.name ?? "?"} avatar={otherUser?.avatar} size={40} />

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 mb-0.5">
          <p className={`truncate text-[var(--text-body-sm)] ${hasUnread ? "font-[600] text-[var(--color-text-heading)]" : "font-[500] text-[var(--color-text-body)]"}`}>
            {convo.hostelName}
          </p>
          <span className="text-[var(--text-caption)] text-[var(--color-text-muted)] shrink-0">
            {timeAgo}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {lastMsg && (
            <p className={`truncate text-[var(--text-caption)] flex-1 ${hasUnread ? "text-[var(--color-text-body)]" : "text-[var(--color-text-muted)]"}`}>
              {lastMsg.senderId === currentUserId ? "You: " : ""}
              {lastMsg.content}
            </p>
          )}
          {hasUnread && (
            <span className="flex h-2 w-2 shrink-0 rounded-full bg-[var(--color-action)]" aria-label="Unread message" />
          )}
        </div>
      </div>
    </button>
  );
}

/* -- Message bubble ---------------------------------------- */
function MessageBubble({
  message,
  isMine,
}: {
  message: Message;
  isMine: boolean;
}) {
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[75%] rounded-[var(--radius-lg)] px-4 py-2.5 ${
          isMine
            ? "bg-[var(--color-primary-light)] text-[var(--color-primary-deep)] rounded-br-[var(--radius-sm)]"
            : "bg-[var(--color-bg-sidebar)] text-[var(--color-text-body)] rounded-bl-[var(--radius-sm)]"
        }`}
      >
        <p className="text-[var(--text-body-sm)] leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
        </p>
        <p className={`text-[var(--text-caption)] mt-1 ${isMine ? "text-[var(--color-primary-deep)]/60 text-right" : "text-[var(--color-text-muted)]"}`}>
          {format(new Date(message.createdAt), "h:mm a")}
        </p>
      </div>
    </div>
  );
}

/* -- Message thread ---------------------------------------- */
function MessageThread({
  conversationId,
  currentUserId,
  onBack,
}: {
  conversationId: string;
  currentUserId: string;
  onBack: () => void;
}) {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  const { data, isLoading } = useQuery<{ data: { messages: Message[]; participants: any[] } }>({
    queryKey: ["conversation", conversationId],
    queryFn: async () => {
      const res = await fetch(`/api/conversations/${conversationId}`);
      if (!res.ok) throw new Error("Failed to load messages");
      return res.json();
    },
    // Poll every 5 seconds when tab is focused
    refetchInterval: 5_000,
    refetchIntervalInBackground: false,
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.data?.messages?.length]);

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Send failed");
      return json;
    },
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      inputRef.current?.focus();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate(trimmed);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const messages   = data?.data?.messages ?? [];
  const otherUser  = data?.data?.participants?.find((p: any) => p.userId !== currentUserId)?.user;

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border-subtle)] shrink-0">
        <button
          onClick={onBack}
          className="lg:hidden flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-overlay)] transition-colors duration-[var(--transition-fast)]"
          aria-label="Back to conversations"
        >
          <ChevronLeft size={18} strokeWidth={1.5} aria-hidden="true" />
        </button>
        {otherUser && <Avatar name={otherUser.name} avatar={otherUser.avatar} size={36} />}
        <div className="min-w-0">
          <p className="text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)] truncate">
            {otherUser?.name ?? "Owner"}
          </p>
          <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">
            Hostel owner
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4" aria-live="polite" aria-label="Messages">
        {isLoading ? (
          <PageSpinner label="Loading messages…" />
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
            <MessageCircle size={32} strokeWidth={1.5} className="text-[var(--color-text-muted)]" aria-hidden="true" />
            <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
              No messages yet. Send one to start the conversation.
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isMine={msg.senderId === currentUserId}
              />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Send form */}
      <div className="px-4 py-3 border-t border-[var(--color-border-subtle)] shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={1}
            aria-label="Message text"
            className="flex-1 min-h-[40px] max-h-32 resize-none rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] px-3.5 py-2.5 text-[var(--text-body-sm)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-placeholder)] transition-all duration-[var(--transition-base)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[oklch(0.62_0.17_65_/_0.15)]"
            style={{ fieldSizing: "content" } as React.CSSProperties}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sendMutation.isPending}
            aria-label="Send message"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-action)] text-white transition-all duration-[var(--transition-base)] hover:bg-[var(--color-action-dark)] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[var(--color-action-light)] focus-visible:outline-offset-2"
          >
            {sendMutation.isPending ? (
              <Loader2 size={16} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
            ) : (
              <Send size={16} strokeWidth={1.5} aria-hidden="true" />
            )}
          </button>
        </div>
        <p className="mt-1.5 text-[var(--text-caption)] text-[var(--color-text-muted)]">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

/* -- Page --------------------------------------------------- */
export default function MessagesPage() {
  const { data: session } = useSession();
  const searchParams      = useSearchParams();
  const initialConvoId    = searchParams.get("conversation");

  const [activeId,   setActiveId]   = useState<string | null>(initialConvoId);
  const [showThread, setShowThread] = useState(!!initialConvoId);

  const currentUserId = session?.user?.id ?? "";

  const { data, isLoading, isError } = useQuery<{ data: Conversation[] }>({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await fetch("/api/conversations");
      if (!res.ok) throw new Error("Failed to load conversations");
      return res.json();
    },
    refetchInterval: showThread ? undefined : 30_000,
  });

  const conversations = data?.data ?? [];

  function selectConversation(id: string) {
    setActiveId(id);
    setShowThread(true);
  }

  if (isLoading) return <PageSpinner label="Loading messages…" />;
  if (isError)   return <InlineError message="Couldn't load your messages. Please refresh." />;

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={MessageCircle}
        heading="No messages"
        description="Message a hostel owner from any hostel page to start a conversation."
      />
    );
  }

  return (
    <div
      className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] overflow-hidden"
      style={{ height: "calc(100dvh - 280px)", minHeight: 400 }}
    >
      <div className="flex h-full">
        {/* -- Conversation list ----------------------- */}
        <div
          className={`flex flex-col border-r border-[var(--color-border-subtle)] shrink-0 ${
            showThread ? "hidden lg:flex" : "flex w-full"
          } lg:w-[280px]`}
          role="list"
          aria-label="Conversations"
        >
          <div className="px-4 py-3 border-b border-[var(--color-border-subtle)] shrink-0">
            <p className="text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)]">
              Conversations
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((convo) => (
              <div key={convo.id} role="listitem">
                <ConversationItem
                  convo={convo}
                  currentUserId={currentUserId}
                  isActive={activeId === convo.id}
                  onClick={() => selectConversation(convo.id)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* -- Message thread -------------------------- */}
        <div
          className={`flex-1 min-w-0 ${
            showThread ? "flex flex-col" : "hidden lg:flex lg:flex-col"
          }`}
        >
          {activeId ? (
            <MessageThread
              conversationId={activeId}
              currentUserId={currentUserId}
              onBack={() => setShowThread(false)}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-center p-8">
              <div className="space-y-2">
                <MessageCircle size={32} strokeWidth={1.5} className="text-[var(--color-text-muted)] mx-auto" aria-hidden="true" />
                <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
                  Select a conversation to read messages.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
