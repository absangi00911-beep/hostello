// Path: src/app/dashboard/messages/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";
import {
  Send,
  MessageCircle,
  ChevronLeft,
  Search,
  Check,
  CheckCheck,
  ExternalLink,
} from "lucide-react";
import { PageSpinner, InlineError, EmptyState } from "@/components/ui/shared";
import { PhotoImage } from "@/components/landing/PhotoImage";
import { StudentBadge } from "@/components/ui/StudentBadge";
import {
  Avatar as AvatarPrimitive,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

/* -- Types ------------------------------------------------- */
interface ParticipantUser {
  id: string;
  name: string;
  avatar?: string | null;
  role?: "STUDENT" | "OWNER" | "ADMIN";
  studentVerified?: boolean;
}

interface Conversation {
  id: string;
  hostelName: string;
  hostelId: string;
  updatedAt: string;
  hostel?: { name: string; slug: string; coverImage?: string | null } | null;
  participants: { userId: string; user: ParticipantUser }[];
  messages?: { content: string; senderId: string; read: boolean; createdAt: string }[];
  unreadCount?: number;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

interface BookingContext {
  checkIn: string;
  checkOut: string;
  months: number;
  status: string;
}

/* -- User avatar — thin wrapper around the real Avatar primitive ---- */
function Avatar({ name, avatar, size = 36 }: { name: string; avatar?: string | null; size?: number }) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <AvatarPrimitive style={{ width: size, height: size }} className="shrink-0" aria-hidden="true">
      <AvatarImage src={avatar ?? undefined} alt="" />
      <AvatarFallback style={{ fontSize: size * 0.38 }}>
        {initials}
      </AvatarFallback>
    </AvatarPrimitive>
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
  const messages  = convo.messages ?? [];
  const lastMsg   = messages[messages.length - 1];
  const hasUnread = messages.some((m) => !m.read && m.senderId !== currentUserId);
  const otherUser = convo.participants?.find((p) => p.userId !== currentUserId)?.user;
  const timeAgo   = formatDistanceToNow(new Date(convo.updatedAt), { addSuffix: false });

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
          <p className={`truncate text-[length:var(--text-body-sm)] ${hasUnread ? "font-[600] text-[color:var(--color-text-heading)]" : "font-[500] text-[color:var(--color-text-body)]"}`}>
            {otherUser?.name ?? "Unknown user"}
          </p>
          <span className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)] shrink-0">
            {timeAgo}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mb-1">
          {lastMsg && (
            <p className={`truncate text-[length:var(--text-caption)] flex-1 ${hasUnread ? "text-[color:var(--color-text-body)]" : "text-[color:var(--color-text-muted)]"}`}>
              {lastMsg.senderId === currentUserId ? "You: " : ""}
              {lastMsg.content}
            </p>
          )}
          {hasUnread && (
            <span className="flex h-2 w-2 shrink-0 rounded-[var(--radius-full)] bg-[var(--color-action)]" aria-label="Unread message" />
          )}
        </div>
        <p className="truncate text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
          🛏 {convo.hostel?.name ?? convo.hostelName}
        </p>
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
            ? "bg-[var(--color-primary)] text-[color:var(--color-text-inverse)] rounded-br-[var(--radius-sm)]"
            : "bg-[var(--color-bg-card)] border border-[var(--color-border-default)] text-[color:var(--color-text-body)] rounded-bl-[var(--radius-sm)]"
        }`}
      >
        <p className="text-[length:var(--text-body-sm)] leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
        </p>
        <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end text-[color:var(--color-text-inverse)]" : "text-[color:var(--color-text-muted)]"}`}>
          <p className="text-[length:var(--text-caption)]">
            {format(new Date(message.createdAt), "h:mm a")}
          </p>
          {isMine && (
            message.read
              ? <CheckCheck size={13} strokeWidth={2} aria-label="Read" />
              : <Check size={13} strokeWidth={2} aria-label="Sent" />
          )}
        </div>
      </div>
    </div>
  );
}

/* -- Booking context card ----------------------------------- */
function BookingContextCard({
  hostel,
  booking,
}: {
  hostel: { name: string; slug: string; coverImage?: string | null };
  booking: BookingContext;
}) {
  const checkIn  = new Date(booking.checkIn);
  const checkOut = new Date(booking.checkOut);
  return (
    <Link
      href={`/hostels/${hostel.slug}`}
      className="hidden sm:flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-sidebar)] px-3 py-2 transition-colors duration-[var(--transition-fast)] hover:bg-[var(--color-bg-overlay)]"
    >
      {hostel.coverImage ? (
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-[var(--radius-sm)]">
          <PhotoImage
            src={hostel.coverImage}
            alt=""
            fill
            sizes="40px"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-bg-overlay)]">
          <MessageCircle size={16} strokeWidth={1.5} className="text-[color:var(--color-text-muted)]" aria-hidden="true" />
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-[length:var(--text-body-sm)] font-[600] text-[color:var(--color-text-heading)]">
          {hostel.name}
        </p>
        <p className="truncate text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
          {format(checkIn, "MMM d")} – {format(checkOut, "MMM d")} · {booking.months} {booking.months === 1 ? "month" : "months"}
        </p>
      </div>
      <ExternalLink size={13} strokeWidth={2} className="shrink-0 text-[color:var(--color-text-muted)]" aria-hidden="true" />
    </Link>
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
  const [messagePage, setMessagePage] = useState(1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  const { data, isLoading } = useQuery<{
    data: {
      messages: Message[];
      participants: { userId: string; user: ParticipantUser }[];
      hostel?: { name: string; slug: string; coverImage?: string | null } | null;
      booking?: BookingContext | null;
      messageTotal: number;
      messagePage: number;
      messageLimit: number;
      messageHasMore: boolean;
    };
  }>({
    queryKey: ["conversation", conversationId, messagePage],
    queryFn: async () => {
      const res = await fetch(`/api/conversations/${conversationId}?page=${messagePage}&limit=50`);
      if (!res.ok) throw new Error("Failed to load messages");
      return res.json();
    },
    // Poll the latest page only. Older history remains stable while browsing.
    refetchInterval: messagePage === 1 ? 5_000 : undefined,
    refetchIntervalInBackground: false,
  });

  const latestMessageId = data?.data?.messages?.at(-1)?.id;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [latestMessageId, messagePage]);

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
      setMessagePage(1);
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
  const otherUser  = data?.data?.participants?.find((p) => p.userId !== currentUserId)?.user;
  const hostel     = data?.data?.hostel;
  const booking    = data?.data?.booking;
  const isVerifiedStudent = otherUser?.role === "STUDENT" && otherUser?.studentVerified;

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border-subtle)] shrink-0">
        <button
          onClick={onBack}
          className="lg:hidden flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-[color:var(--color-text-muted)] hover:bg-[var(--color-bg-overlay)] transition-colors duration-[var(--transition-fast)]"
          aria-label="Back to conversations"
        >
          <ChevronLeft size={18} strokeWidth={1.5} aria-hidden="true" />
        </button>
        {otherUser && <Avatar name={otherUser.name} avatar={otherUser.avatar} size={36} />}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[length:var(--text-body-sm)] font-[600] text-[color:var(--color-text-heading)] truncate">
              {otherUser?.name ?? "Loading…"}
            </p>
            {isVerifiedStudent && <StudentBadge />}
          </div>
          <p className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
            {otherUser?.role === "OWNER" ? "Hostel owner" : otherUser?.role === "STUDENT" ? "Student" : "\u00A0"}
          </p>
        </div>
        {hostel && booking && <BookingContextCard hostel={hostel} booking={booking} />}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4" aria-live="polite" aria-label="Messages">
        {data && data.data.messageTotal > data.data.messageLimit && (
          <div className="sticky top-0 z-10 mb-3 flex items-center justify-between gap-3 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/95 px-3 py-2 backdrop-blur">
            <button
              type="button"
              onClick={() => setMessagePage((current) => Math.max(1, current - 1))}
              disabled={messagePage === 1}
              className="rounded-md border border-[var(--color-border-default)] px-2.5 py-1 text-xs focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] disabled:opacity-50"
            >
              Newer
            </button>
            <span className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
              History page {messagePage} of {Math.max(1, Math.ceil(data.data.messageTotal / data.data.messageLimit))}
            </span>
            <button
              type="button"
              onClick={() => setMessagePage((current) => current + 1)}
              disabled={!data.data.messageHasMore}
              className="rounded-md border border-[var(--color-border-default)] px-2.5 py-1 text-xs focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] disabled:opacity-50"
            >
              Older
            </button>
          </div>
        )}
        {isLoading ? (
          <PageSpinner label="Loading messages…" />
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
            <MessageCircle size={32} strokeWidth={1.5} className="text-[color:var(--color-text-muted)]" aria-hidden="true" />
            <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">
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
            className="flex-1 min-h-[40px] max-h-32 resize-none rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] px-3.5 py-2.5 text-[length:var(--text-body-sm)] text-[color:var(--color-text-body)] placeholder:text-[color:var(--color-text-placeholder)] transition-all duration-[var(--transition-base)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[var(--color-primary)]/15"
            style={{ fieldSizing: "content" } as React.CSSProperties}
          />
          <Button
            onClick={handleSend}
            loading={sendMutation.isPending}
            disabled={!text.trim()}
            size="icon"
            aria-label="Send message"
          >
            {!sendMutation.isPending && <Send size={16} strokeWidth={1.5} aria-hidden="true" />}
          </Button>
        </div>
        <p className="mt-1.5 text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

/* -- Page --------------------------------------------------- */
export default function MessagesPage() {
  const pathname = usePathname();
  const isOwnerMessages = pathname.startsWith("/owner/messages");
  const { data: session } = useSession();
  const searchParams      = useSearchParams();
  const initialConvoId    = searchParams.get("conversation");

  const [activeId,   setActiveId]   = useState<string | null>(initialConvoId);
  const [showThread, setShowThread] = useState(!!initialConvoId);
  const [query,      setQuery]      = useState("");
  const [tab,        setTab]        = useState<"all" | "unread">("all");
  const [listPage,   setListPage]   = useState(1);

  const currentUserId = session?.user?.id ?? "";
  const normalizedQuery = query.trim();

  const { data, isLoading, isError } = useQuery<{
    data: Conversation[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }>({
    queryKey: ["conversations", listPage, tab, normalizedQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(listPage),
        limit: "20",
        unread: String(tab === "unread"),
      });
      if (normalizedQuery) params.set("search", normalizedQuery);
      const res = await fetch(`/api/conversations?${params}`);
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

  if (data?.total === 0) {
    return (
      <div className={`${isOwnerMessages ? "owner-account-page owner-message-inbox" : "student-account-page student-messages-page"} space-y-4`}>
        <header className="student-page-heading">
          <div className="student-page-overline"><span>{isOwnerMessages ? "OWNER CORRESPONDENCE" : "OPEN CORRESPONDENCE"}</span><span>{isOwnerMessages ? "04 / 09" : "01 / 05"}</span></div>
          <h2>Messages</h2>
          <p>{isOwnerMessages ? "Keep student questions and booking details close at hand." : "Keep the details of your stay in one thoughtful place."}</p>
        </header>
        <EmptyState
          icon={MessageCircle}
          heading={query || tab === "unread" ? "No conversations match" : "No messages"}
          description={query || tab === "unread" ? "Try another search or switch to all conversations." : isOwnerMessages ? "Student conversations will appear here when someone contacts you about a hostel." : "Message a hostel owner from any hostel page to start a conversation."}
        />
      </div>
    );
  }

  return (
    <div className={`${isOwnerMessages ? "owner-account-page owner-message-inbox" : "student-account-page student-messages-page"} space-y-4`}>
      <header className="student-page-heading">
        <div className="student-page-overline"><span>{isOwnerMessages ? "OWNER CORRESPONDENCE" : "OPEN CORRESPONDENCE"}</span><span>{isOwnerMessages ? "04 / 09" : "01 / 05"}</span></div>
        <h2>Messages</h2>
        <p>{isOwnerMessages ? "Keep student questions and booking details close at hand." : "Keep the details of your stay in one thoughtful place."}</p>
      </header>
      <div
        className="student-message-shell rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] overflow-hidden"
        style={{ height: "calc(100dvh - 360px)", minHeight: 360 }}
      >
      <div className="flex h-full">
        {/* -- Conversation list ----------------------- */}
        <div
          className={`flex flex-col border-r border-[var(--color-border-subtle)] shrink-0 ${
            showThread ? "hidden lg:flex" : "flex w-full"
          } lg:w-[300px]`}
          role="list"
          aria-label="Conversations"
        >
          <div className="px-3 py-3 border-b border-[var(--color-border-subtle)] shrink-0 space-y-2.5">
            <div className="relative">
              <Search
                size={14}
                strokeWidth={2}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-text-muted)]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                maxLength={100}
                onChange={(e) => { setListPage(1); setQuery(e.target.value); }}
                placeholder="Search messages…"
                aria-label="Search conversations"
                className="w-full rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-bg-sidebar)] py-1.5 pl-8 pr-3 text-[length:var(--text-body-sm)] text-[color:var(--color-text-body)] placeholder:text-[color:var(--color-text-placeholder)] transition-colors duration-[var(--transition-fast)] focus:outline-none focus:border-[var(--color-primary)] focus:bg-[var(--color-bg-card)]"
              />
            </div>
            <div className="flex gap-1.5">
              {(["all", "unread"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setListPage(1); setTab(t); }}
                  className={`rounded-[var(--radius-full)] px-3 py-1 text-[length:var(--text-caption)] font-[600] capitalize transition-colors duration-[var(--transition-fast)] ${
                    tab === t
                      ? "bg-[var(--color-text-heading)] text-[color:var(--color-text-inverse)]"
                      : "bg-[var(--color-bg-sidebar)] text-[color:var(--color-text-muted)] hover:bg-[var(--color-bg-overlay)]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="px-4 py-6 text-center text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">
                No conversations on this page.
              </p>
            ) : (
              conversations.map((convo) => (
                <div key={convo.id} role="listitem">
                  <ConversationItem
                    convo={convo}
                    currentUserId={currentUserId}
                    isActive={activeId === convo.id}
                    onClick={() => selectConversation(convo.id)}
                  />
                </div>
              ))
            )}
          </div>
          {(listPage > 1 || data?.hasMore) && (
            <div className="flex items-center justify-between border-t border-[var(--color-border-subtle)] px-3 py-2">
              <button
                type="button"
                onClick={() => setListPage((current) => Math.max(1, current - 1))}
                disabled={listPage === 1}
                className="rounded-md border border-[var(--color-border-default)] px-2.5 py-1 text-xs focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
                {listPage} / {Math.max(1, Math.ceil((data?.total ?? 0) / (data?.limit ?? 20)))}
              </span>
              <button
                type="button"
                onClick={() => setListPage((current) => current + 1)}
                disabled={!data?.hasMore}
                className="rounded-md border border-[var(--color-border-default)] px-2.5 py-1 text-xs focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* -- Message thread -------------------------- */}
        <div
          className={`flex-1 min-w-0 ${
            showThread ? "flex flex-col" : "hidden lg:flex lg:flex-col"
          }`}
        >
          {activeId ? (
            <MessageThread
              key={activeId}
              conversationId={activeId}
              currentUserId={currentUserId}
              onBack={() => setShowThread(false)}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-center p-8">
              <div className="space-y-2">
                <MessageCircle size={32} strokeWidth={1.5} className="text-[color:var(--color-text-muted)] mx-auto" aria-hidden="true" />
                <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">
                  Select a conversation to read messages.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
