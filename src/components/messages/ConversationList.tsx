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
    <aside className="min-w-0 border-r border-line py-[18px]" aria-label="Conversation list">
      <div className="flex items-center justify-between border-b border-line px-[18px] pb-[14px]">
        <h2 className="m-0 text-[1.05rem] tracking-[-0.02em] text-ink">
          Inbox
        </h2>
        <span className="grid h-6 min-w-[26px] place-items-center rounded-full bg-surface-muted text-[0.78rem] font-bold text-muted">
          {page?.total ?? 0}
        </span>
      </div>
      {error && (
        <div
          className="m-3 rounded-lg border border-[#e4b8aa] bg-[#fff5f1] p-3 text-[0.88rem] text-[#772e1b]"
          role="alert"
        >
          <p className="m-0">{error}</p>
          <button
            className="mt-2 rounded-lg border border-line bg-white px-[11px] py-2 text-[0.88rem] font-semibold text-ink transition-colors hover:border-brand"
            onClick={onRetry}
            type="button"
          >
            Retry
          </button>
        </div>
      )}
      {loading && conversations.length === 0 ? (
        <p className="m-0 px-[18px] py-[22px] text-[0.9rem] text-muted" role="status">
          Loading conversations…
        </p>
      ) : conversations.length === 0 && !error ? (
        <p className="m-0 px-[18px] py-[22px] text-[0.9rem] text-muted">
          Your hostel conversations will appear here.
        </p>
      ) : (
        <ul className="m-0 max-h-[540px] list-none overflow-y-auto p-0">
          {conversations.map((conversation) => {
            const latestMessage = conversation.messages[0];
            const selected = conversation.id === selectedConversationId;
            const otherParticipant = conversation.participants.find(
              (participant) => participant.userId !== currentUserId,
            );
            const otherName = participantName(
              conversation.participants,
              currentUserId,
            );
            return (
              <li className="border-t border-line first:border-t-0" key={conversation.id}>
                <button
                  aria-current={selected ? "page" : undefined}
                  className={`flex w-full min-w-0 items-center gap-[11px] p-[14px_16px] text-left text-inherit transition-colors hover:bg-[#f4f4ed] ${selected ? "bg-[#f4f4ed]" : "bg-transparent"}`}
                  onClick={() => onSelect(conversation.id)}
                  type="button"
                >
                  <span
                    aria-hidden="true"
                    className="grid h-[38px] w-[38px] flex-none place-items-center rounded-full bg-brand-soft text-[0.95rem] font-black text-brand-dark"
                  >
                    {otherParticipant?.user.avatar ? (
                      <Image
                        alt=""
                        className="h-[38px] w-[38px] rounded-full object-cover"
                        height={38}
                        src={otherParticipant.user.avatar}
                        unoptimized
                        width={38}
                      />
                    ) : (
                      otherName.slice(0, 1).toUpperCase()
                    )}
                  </span>
                  <span className="grid min-w-0 flex-1 gap-[2px]">
                    <span className="flex min-w-0 items-baseline justify-between gap-2">
                      <strong className="overflow-hidden text-ellipsis whitespace-nowrap text-[0.9rem] text-ink">
                        {otherName}
                      </strong>
                      <time
                        className="overflow-hidden text-ellipsis whitespace-nowrap text-[0.78rem] text-muted"
                        dateTime={conversation.updatedAt}
                      >
                        {displayMessageDate(conversation.updatedAt)}
                      </time>
                    </span>
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[0.78rem] text-muted">
                      {conversation.hostelName}
                    </span>
                    <span className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[0.78rem] text-muted">
                      {latestMessage?.content ?? "Start the conversation"}
                    </span>
                  </span>
                  {conversation.unreadCount > 0 && (
                    <span
                      aria-label={`${conversation.unreadCount} unread messages`}
                      className="grid h-[22px] min-w-[22px] flex-none place-items-center rounded-full bg-brand text-[0.72rem] font-bold text-white"
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
          className="mx-auto mt-3 block w-[calc(100%-32px)] rounded-lg border border-line bg-surface px-3 py-2 text-[0.88rem] font-semibold text-ink transition-colors hover:border-brand disabled:cursor-wait disabled:opacity-60"
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
