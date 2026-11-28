import { type FormEvent, useEffect, useRef } from "react";
import {
  displayMessageDate,
  participantName,
  type ConversationMessage,
  type ConversationThread,
} from "@/lib/messages-inbox";
import { shouldScrollToLatest } from "./scroll-to-latest";

interface ConversationThreadProps {
  conversationId: string | null;
  pendingInquiry: boolean;
  currentUserId: string;
  thread?: ConversationThread;
  messages: ConversationMessage[];
  error: string;
  sendError: string;
  loading: boolean;
  refreshing: boolean;
  sending: boolean;
  message: string;
  onMessageChange: (message: string) => void;
  onRefresh: () => void;
  onRetry: () => void;
  onLoadOlder: () => void;
  onSend: (event: FormEvent<HTMLFormElement>) => void;
}

export function ConversationThread({
  conversationId,
  pendingInquiry,
  currentUserId,
  thread,
  messages,
  error,
  sendError,
  loading,
  refreshing,
  sending,
  message,
  onMessageChange,
  onRefresh,
  onRetry,
  onLoadOlder,
  onSend,
}: ConversationThreadProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const seen = useRef<{ conversationId: string | null; lastMessageId: string | null }>({
    conversationId: null,
    lastMessageId: null,
  });
  const lastMessage = messages.at(-1) ?? null;

  useEffect(() => {
    if (!conversationId || !lastMessage) return;
    if (
      shouldScrollToLatest({
        previousConversationId: seen.current.conversationId,
        previousLastMessageId: seen.current.lastMessageId,
        conversationId,
        lastMessageId: lastMessage.id,
        lastMessageIsOwn: lastMessage.senderId === currentUserId,
      })
    ) {
      endRef.current?.scrollIntoView({ block: "end" });
    }
    seen.current = { conversationId, lastMessageId: lastMessage.id };
  }, [conversationId, currentUserId, lastMessage]);

  if (!conversationId || pendingInquiry) {
    return (
      <section className="flex min-w-0 flex-col" aria-label="Conversation">
        <div className="flex min-h-[340px] flex-1 flex-col items-center justify-center px-5 py-8 text-center">
          <span
            aria-hidden="true"
            className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-title text-brand-dark"
          >
            ↗
          </span>
          <h2 className="m-0 text-title tracking-[-0.045em] text-ink">
            Select a conversation
          </h2>
          <p className="mt-2 m-0 text-label text-muted">
            Choose a hostel conversation to read and reply.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-w-0 flex-col" aria-label="Conversation">
      <div className="flex min-h-[78px] items-center justify-between gap-[14px] border-b border-line px-5 py-[14px]">
        <div>
          <p className="m-0 mb-1 text-label font-bold uppercase tracking-[0.09em] text-muted">
            {thread?.hostelName ?? "Hostel conversation"}
          </p>
          <h2 className="m-0 text-title tracking-[-0.045em] text-ink">
            {thread
              ? participantName(thread.participants, currentUserId)
              : "Conversation"}
          </h2>
        </div>
        <button
          aria-label="Refresh conversation"
          className="min-h-11 cursor-pointer rounded-lg border border-line bg-surface px-4 text-label font-semibold text-ink hover:border-brand disabled:cursor-wait disabled:opacity-60 btn-secondary"
          disabled={refreshing || loading}
          onClick={onRefresh}
          type="button"
        >
          {refreshing || loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      {error && (
        <div
          className="mt-3 mx-[18px] rounded-lg border border-danger bg-surface p-3 text-label text-danger"
          role="alert"
        >
          <p className="m-0">{error}</p>
          <button
            className="mt-2 min-h-11 rounded-lg border border-line bg-white px-4 text-label font-semibold text-ink hover:border-brand btn-secondary"
            onClick={onRetry}
            type="button"
          >
            Retry
          </button>
        </div>
      )}
      {!thread ? (
        <p
          className="m-0 px-[18px] py-[22px] text-label text-muted"
          role={loading ? "status" : undefined}
        >
          {loading ? "Loading messages…" : "This conversation is unavailable."}
        </p>
      ) : (
        <>
          <div
            aria-live="polite"
            className="flex min-h-[270px] flex-1 flex-col gap-3 overflow-y-auto px-5 py-4"
          >
            {thread?.messageHasMore && (
              <button
                className="min-h-11 self-center rounded-lg border border-line bg-surface px-4 text-label font-semibold text-ink hover:border-brand disabled:cursor-wait disabled:opacity-60 btn-secondary"
                disabled={refreshing}
                onClick={onLoadOlder}
                type="button"
              >
                Load older messages
              </button>
            )}
            {messages.length === 0 && !error ? (
              <p className="m-auto text-center text-label text-muted">
                No messages yet. Send the first reply.
              </p>
            ) : (
              messages.map((item) => {
                const isOwnMessage = item.senderId === currentUserId;
                return (
                  <article
                    className={`w-fit max-w-[min(76%,560px)] rounded-[9px_9px_9px_2px] border border-line bg-surface px-[13px] py-[11px] ${
                      isOwnMessage
                        ? "ml-auto self-end rounded-[9px_9px_2px_9px] border-brand-soft bg-brand-soft"
                        : ""
                    }`}
                    key={item.id}
                  >
                    <div className="flex items-baseline gap-[9px] text-label text-muted">
                      <strong className="text-ink">
                        {isOwnMessage ? "You" : item.sender.name || "Hostello member"}
                      </strong>
                      <time dateTime={item.createdAt}>
                        {displayMessageDate(item.createdAt)}
                      </time>
                    </div>
                    <p className="mt-1 m-0 overflow-wrap-anywhere whitespace-pre-wrap">
                      {item.content}
                    </p>
                  </article>
                );
              })
            )}
            <div aria-hidden="true" className="scroll-mb-4" ref={endRef} />
          </div>
          <form className="border-t border-line px-[18px] pb-4 pt-[14px]" onSubmit={onSend}>
            <label className="mb-[7px] block text-label font-bold text-ink" htmlFor="messages-compose-input">
              Write a message
            </label>
            <textarea
              className="block min-h-[84px] w-full resize-y rounded-lg border border-control-border bg-white px-3 py-2.5 text-ink placeholder:text-muted focus-visible:border-brand"
              id="messages-compose-input"
              maxLength={2_000}
              onChange={(event) => onMessageChange(event.currentTarget.value)}
              placeholder="Share a helpful reply…"
              required
              rows={3}
              value={message}
            />
            {sendError && <p className="mt-2 mb-0 text-label text-danger" role="alert">{sendError}</p>}
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-label text-muted">
                Keep personal contact details private.
              </span>
              <button
                className="min-h-11 rounded-lg border border-brand bg-brand px-5 text-label font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-wait disabled:opacity-60"
                disabled={sending || !message.trim()}
                type="submit"
              >
                {sending ? "Sending…" : "Send message"}
              </button>
            </div>
          </form>
        </>
      )}
    </section>
  );
}
