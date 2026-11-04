import Link from "next/link";
import {
  displayMessageDate,
  participantName,
} from "@/lib/messages-inbox";
import Image from "next/image";
import { Search, Settings } from "lucide-react";
import { useState } from "react";
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
  searchQuery: string;
  unreadOnly: boolean;
  onSelect: (conversationId: string) => void;
  onRetry: () => void;
  onLoadMore: () => void;
  onSearchChange: (search: string) => void;
  onUnreadOnlyChange: (unreadOnly: boolean) => void;
  onRefresh: () => void;
}

interface ConversationListHeaderProps {
  total: number;
  loading: boolean;
  searchQuery: string;
  unreadOnly: boolean;
  onSearchChange: (search: string) => void;
  onUnreadOnlyChange: (unreadOnly: boolean) => void;
  onRefresh: () => void;
}

function ConversationListHeader({
  total,
  loading,
  searchQuery,
  unreadOnly,
  onSearchChange,
  onUnreadOnlyChange,
  onRefresh,
}: ConversationListHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 pb-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <h1 className="m-0 text-[1.35rem] font-semibold tracking-[-0.045em] text-ink">
            Messages
          </h1>
          <span
            aria-label={`Total ${total} conversations`}
            className="grid h-6 min-w-6 place-items-center rounded-full bg-surface-muted px-1.5 text-[0.78rem] font-bold text-muted"
            role="status"
          >
            {total}
          </span>
        </div>
        <div className="flex flex-none items-center gap-2">
          <button
            aria-controls="conversation-search"
            aria-expanded={searchOpen}
            aria-label="Search conversations"
            className="grid h-10 w-10 cursor-pointer place-items-center rounded-full border border-line bg-surface text-ink shadow-[0_1px_2px_rgb(15_23_42/0.06)] transition-[background-color,border-color,box-shadow,translate] duration-150 hover:border-[#cbd5e1] hover:bg-surface-muted active:translate-y-px active:bg-[#e2e8f0] active:shadow-none disabled:shadow-none disabled:active:translate-y-0 motion-reduce:transition-none motion-reduce:active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand btn-secondary"
            onClick={() => {
              if (searchOpen) onSearchChange("");
              setSearchOpen((open) => !open);
            }}
            type="button"
          >
            <Search aria-hidden="true" size={19} strokeWidth={1.8} />
          </button>
          <div className="relative">
            <button
              aria-controls="inbox-settings"
              aria-expanded={settingsOpen}
              aria-label="Inbox settings"
              className="grid h-10 w-10 cursor-pointer place-items-center rounded-full border border-line bg-surface text-ink shadow-[0_1px_2px_rgb(15_23_42/0.06)] transition-[background-color,border-color,box-shadow,translate] duration-150 hover:border-[#cbd5e1] hover:bg-surface-muted active:translate-y-px active:bg-[#e2e8f0] active:shadow-none disabled:shadow-none disabled:active:translate-y-0 motion-reduce:transition-none motion-reduce:active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand btn-secondary"
              onClick={() => setSettingsOpen((open) => !open)}
              type="button"
            >
              <Settings aria-hidden="true" size={19} strokeWidth={1.8} />
            </button>
            <div
              className={`absolute right-0 top-[calc(100%+8px)] z-20 min-w-[220px] gap-3 rounded-lg border border-line bg-surface p-4 shadow-sm ${settingsOpen ? "grid" : "hidden"}`}
              id="inbox-settings"
              role="group"
              aria-label="Inbox settings"
            >
              <label className="flex cursor-pointer items-center gap-2.5 text-[0.88rem] text-ink">
                <input
                  checked={unreadOnly}
                  className="h-4 w-4 accent-brand"
                  onChange={(event) =>
                    onUnreadOnlyChange(event.currentTarget.checked)
                  }
                  type="checkbox"
                />
                Unread messages only
              </label>
              <button
                className="cursor-pointer rounded-md border border-line bg-surface px-3 py-2 text-left text-[0.88rem] font-semibold text-ink hover:border-brand disabled:cursor-wait disabled:opacity-60 btn-secondary"
                disabled={loading}
                onClick={onRefresh}
                type="button"
              >
                Refresh inbox
              </button>
            </div>
          </div>
        </div>
      </div>
      <div
        className={`border-b border-line px-5 py-3 ${searchOpen ? "block" : "hidden"}`}
      >
        <label className="sr-only" htmlFor="conversation-search">
          Search conversations
        </label>
        <input
          autoComplete="off"
          className="h-11 w-full rounded-full border border-line bg-surface px-4 text-[0.9rem] text-ink placeholder:text-muted focus:border-brand focus:outline-2 focus:outline-brand"
          id="conversation-search"
          onChange={(event) => onSearchChange(event.currentTarget.value)}
          placeholder="Search hostels or people"
          type="search"
          value={searchQuery}
        />
      </div>
    </>
  );
}

function ConversationListEmptyState({
  searchQuery,
  unreadOnly,
  onSearchChange,
  onUnreadOnlyChange,
}: Pick<
  ConversationListProps,
  "searchQuery" | "unreadOnly" | "onSearchChange" | "onUnreadOnlyChange"
>) {
  const hasActiveFilters = Boolean(searchQuery.trim()) || unreadOnly;

  if (!hasActiveFilters) {
    return (
      <section
        className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center"
        role="status"
      >
        <h2 className="m-0 text-[1.15rem] font-semibold tracking-[-0.035em] text-ink">
          Nothing to see here
        </h2>
        <p className="mt-2 mb-0 max-w-[260px] text-[0.88rem] leading-6 text-muted">
          When you contact a hostel, your conversations will appear here.
        </p>
        <Link
          className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full border border-ink px-4 text-[0.86rem] font-semibold text-ink no-underline hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand btn-secondary"
          href="/search"
        >
          Get started
        </Link>
      </section>
    );
  }

  return (
    <section
      className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center"
      role="status"
    >
      <h2 className="m-0 text-[1.05rem] font-semibold tracking-[-0.025em] text-ink">
        No conversations found
      </h2>
      <p className="mt-2 mb-0 max-w-[260px] text-[0.88rem] leading-6 text-muted">
        Try a different search or update your inbox filters.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {searchQuery.trim() && (
          <button
            className="cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-[0.86rem] font-semibold text-ink hover:border-brand btn-secondary"
            onClick={() => onSearchChange("")}
            type="button"
          >
            Clear search
          </button>
        )}
        {unreadOnly && (
          <button
            className="cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-[0.86rem] font-semibold text-ink hover:border-brand btn-secondary"
            onClick={() => onUnreadOnlyChange(false)}
            type="button"
          >
            Show all conversations
          </button>
        )}
      </div>
    </section>
  );
}

export function ConversationList({
  conversations,
  currentUserId,
  page,
  selectedConversationId,
  error,
  loading,
  paging,
  searchQuery,
  unreadOnly,
  onSelect,
  onRetry,
  onLoadMore,
  onSearchChange,
  onUnreadOnlyChange,
  onRefresh,
}: ConversationListProps) {
  return (
    <aside
      className="flex min-h-0 min-w-0 flex-col border-r border-line py-5 [@media(max-width:720px)]:border-r-0"
      aria-label="Conversation list"
    >
      <ConversationListHeader
        loading={loading}
        onRefresh={onRefresh}
        onSearchChange={onSearchChange}
        onUnreadOnlyChange={onUnreadOnlyChange}
        searchQuery={searchQuery}
        total={page?.total ?? 0}
        unreadOnly={unreadOnly}
      />
      {error && (
        <div
          className="m-3 rounded-lg border border-[#e4b8aa] bg-[#fff5f1] p-3 text-[0.88rem] text-[#772e1b]"
          role="alert"
        >
          <p className="m-0">{error}</p>
          <button
            className="mt-2 rounded-lg border border-line bg-white px-[11px] py-2 text-[0.88rem] font-semibold text-ink hover:border-brand btn-secondary"
            onClick={onRetry}
            type="button"
          >
            Retry
          </button>
        </div>
      )}
      {loading && conversations.length === 0 ? (
        <p className="m-0 px-5 py-6 text-[0.9rem] text-muted" role="status">
          Loading conversations…
        </p>
      ) : conversations.length === 0 && !error ? (
        <ConversationListEmptyState
          onSearchChange={onSearchChange}
          onUnreadOnlyChange={onUnreadOnlyChange}
          searchQuery={searchQuery}
          unreadOnly={unreadOnly}
        />
      ) : (
        <ul className="m-0 min-h-0 flex-1 list-none overflow-y-auto p-0">
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
          className="mx-auto mt-3 block w-[calc(100%-32px)] rounded-lg border border-line bg-surface px-3 py-2 text-[0.88rem] font-semibold text-ink hover:border-brand disabled:cursor-wait disabled:opacity-60 btn-secondary"
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
