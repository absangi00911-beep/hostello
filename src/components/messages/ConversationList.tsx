import {
  displayMessageDate,
  participantName,
} from "@/lib/messages-inbox";
import Image from "next/image";
import type {
  ConversationListPage,
  ConversationPreview,
} from "@/lib/messages-inbox";

interface ConversationListProps {
  conversations: ConversationPreview[];
  currentUserId: string;
  page: ConversationListPage | null;
  selectedConversationId: string | null;
  error: string;
  loading: boolean;
  paging: boolean;
  onSelect: (conversationId: string) => void;
  onRetry: () => void;
  onLoadMore: () => void;
}

export function ConversationList({
  conversations,
  currentUserId,
  page,
  selectedConversationId,
  error,
  loading,
  paging,
  onSelect,
  onRetry,
  onLoadMore,
}: ConversationListProps) {
  return (
    <aside className="messages-list-panel" aria-label="Conversation list">
      <div className="messages-list-heading">
        <h2>Inbox</h2>
        <span>{page?.total ?? 0}</span>
      </div>
      {error && (
        <div className="messages-error" role="alert">
          <p>{error}</p>
          <button onClick={onRetry} type="button">Retry</button>
        </div>
      )}
      {loading && conversations.length === 0 ? (
        <p className="messages-loading" role="status">Loading conversations…</p>
      ) : conversations.length === 0 && !error ? (
        <p className="messages-empty-list">
          Your hostel conversations will appear here.
        </p>
      ) : (
        <ul className="messages-conversation-list">
          {conversations.map((conversation) => {
            const latestMessage = conversation.messages[0];
            const selected = conversation.id === selectedConversationId;
            const otherParticipant = conversation.participants.find(
              (participant) => participant.userId !== currentUserId,
            );
            const otherName = participantName(conversation.participants, currentUserId);
            return (
              <li key={conversation.id}>
                <button
                  aria-current={selected ? "page" : undefined}
                  className={`messages-conversation${selected ? " is-selected" : ""}`}
                  onClick={() => onSelect(conversation.id)}
                  type="button"
                >
                  <span className="messages-avatar" aria-hidden="true">
                    {otherParticipant?.user.avatar ? (
                      <Image
                        alt=""
                        height={38}
                        src={otherParticipant.user.avatar}
                        unoptimized
                        width={38}
                      />
                    ) : (
                      otherName.slice(0, 1).toUpperCase()
                    )}
                  </span>
                  <span className="messages-conversation-copy">
                    <span className="messages-conversation-topline">
                      <strong>{otherName}</strong>
                      <time dateTime={conversation.updatedAt}>
                        {displayMessageDate(conversation.updatedAt)}
                      </time>
                    </span>
                    <span className="messages-conversation-hostel">
                      {conversation.hostelName}
                    </span>
                    <span className="messages-preview">
                      {latestMessage?.content ?? "Start the conversation"}
                    </span>
                  </span>
                  {conversation.unreadCount > 0 && (
                    <span
                      className="messages-unread-count"
                      aria-label={`${conversation.unreadCount} unread messages`}
                    >
                      {conversation.unreadCount}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {page?.hasMore && (
        <button
          className="messages-load-more"
          disabled={paging}
          onClick={onLoadMore}
          type="button"
        >
          {paging ? "Loading…" : "Load more conversations"}
        </button>
      )}
    </aside>
  );
}
