import { type FormEvent } from "react";
import {
  displayMessageDate,
  participantName,
  type ConversationMessage,
  type ConversationThread,
} from "@/lib/messages-inbox";

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
  if (!conversationId || pendingInquiry) {
    return (
      <section className="messages-thread-panel" aria-label="Conversation">
        <div className="messages-thread-empty">
          <span className="messages-empty-mark" aria-hidden="true">↗</span>
          <h2>Select a conversation</h2>
          <p>Choose a hostel conversation to read and reply.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="messages-thread-panel" aria-label="Conversation">
      <div className="messages-thread-header">
        <div>
          <p className="messages-eyebrow">
            {thread?.hostelName ?? "Hostel conversation"}
          </p>
          <h2>
            {thread
              ? participantName(thread.participants, currentUserId)
              : "Conversation"}
          </h2>
        </div>
        <button
          aria-label="Refresh conversation"
          className="messages-refresh"
          disabled={refreshing || loading}
          onClick={onRefresh}
          type="button"
        >
          {refreshing || loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      {error && (
        <div className="messages-error messages-thread-error" role="alert">
          <p>{error}</p>
          <button onClick={onRetry} type="button">Retry</button>
        </div>
      )}
      {!thread ? (
        <p className="messages-loading" role={loading ? "status" : undefined}>
          {loading ? "Loading messages…" : "This conversation is unavailable."}
        </p>
      ) : (
        <>
          <div className="messages-thread-body" aria-live="polite">
            {thread?.messageHasMore && (
              <button
                className="messages-load-older"
                disabled={refreshing}
                onClick={onLoadOlder}
                type="button"
              >
                Load older messages
              </button>
            )}
            {messages.length === 0 && !error ? (
              <p className="messages-empty-thread">
                No messages yet. Send the first reply.
              </p>
            ) : (
              messages.map((item) => {
                const isOwnMessage = item.senderId === currentUserId;
                return (
                  <article
                    className={`messages-bubble${isOwnMessage ? " is-own" : ""}`}
                    key={item.id}
                  >
                    <div className="messages-bubble-meta">
                      <strong>
                        {isOwnMessage ? "You" : item.sender.name || "Hostello member"}
                      </strong>
                      <time dateTime={item.createdAt}>
                        {displayMessageDate(item.createdAt)}
                      </time>
                    </div>
                    <p>{item.content}</p>
                  </article>
                );
              })
            )}
          </div>
          <form className="messages-compose" onSubmit={onSend}>
            <label htmlFor="messages-compose-input">Write a message</label>
            <textarea
              id="messages-compose-input"
              maxLength={2_000}
              onChange={(event) => onMessageChange(event.currentTarget.value)}
              placeholder="Share a helpful reply…"
              required
              rows={3}
              value={message}
            />
            {sendError && <p role="alert">{sendError}</p>}
            <div className="messages-compose-footer">
              <span>Keep personal contact details private.</span>
              <button disabled={sending || !message.trim()} type="submit">
                {sending ? "Sending…" : "Send message"}
              </button>
            </div>
          </form>
        </>
      )}
    </section>
  );
}
