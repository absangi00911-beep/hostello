"use client";

import Link from "next/link";
import { ConversationList } from "@/components/messages/ConversationList";
import { ConversationThread } from "@/components/messages/ConversationThread";
import { useMessagesInbox } from "@/components/messages/useMessagesInbox";

interface MessagesInboxProps {
  currentUserId: string;
}

export function MessagesInbox({ currentUserId }: MessagesInboxProps) {
  const inbox = useMessagesInbox();

  return (
    <main className="min-h-screen bg-canvas">
      <header className="flex min-h-[76px] items-center justify-between gap-5 border-b border-line bg-surface px-[max(24px,calc((100vw-1240px)/2))] py-3">
        <Link
          className="inline-flex items-center font-black tracking-[-0.04em] text-ink no-underline"
          href="/"
          aria-label="hostello home"
        >
          <span>hostello</span>
        </Link>
        <div className="inline-flex items-center gap-[22px] text-[0.9rem] font-semibold text-muted">
          <Link className="hover:text-brand-dark" href="/">
            Explore hostels
          </Link>
          <button
            className="cursor-pointer rounded-lg border border-line bg-surface px-[13px] py-[9px] text-[0.88rem] font-semibold text-ink transition-colors hover:border-brand disabled:cursor-wait disabled:opacity-60"
            onClick={() => void inbox.loadConversationList(1)}
            type="button"
          >
            Refresh inbox
          </button>
        </div>
      </header>

      <div className="mx-auto w-[min(1920px,calc(100%-64px))] py-[34px] pb-12">
        <div className="mb-6 flex items-end justify-between gap-5">
          <div>
            <p className="mb-1 text-[0.75rem] font-bold uppercase tracking-[0.09em] text-muted">
              Your conversations
            </p>
            <h1>Messages</h1>
          </div>
          <p className="m-0 mb-1 text-[0.92rem] text-muted">
            Keep hostel conversations in one place.
          </p>
        </div>

        {inbox.hasPendingInquiry && (
          <section
            className="mb-[18px] rounded-lg border border-[#d8bd84] bg-[#fbf4e6] p-4 text-[#583c13]"
            aria-live="polite"
          >
            {!inbox.pendingError ? (
              <p role="status">Sending your saved inquiry…</p>
            ) : (
              <>
                <p role="alert">{inbox.pendingError}</p>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  <button
                    className="rounded-lg border border-line bg-surface px-3 py-2 text-[0.88rem] font-semibold text-ink transition-colors hover:border-brand"
                    onClick={inbox.retryPendingInquiry}
                    type="button"
                  >
                    Retry delivery
                  </button>
                  <button
                    className="rounded-lg border border-line bg-transparent px-3 py-2 text-[0.88rem] font-semibold text-ink transition-colors hover:border-brand"
                    onClick={inbox.cancelPendingInquiry}
                    type="button"
                  >
                    Discard saved inquiry
                  </button>
                </div>
              </>
            )}
          </section>
        )}

        <div className="grid min-h-[min(680px,calc(100vh-230px))] grid-cols-[minmax(265px,0.82fr)_minmax(0,1.7fr)] overflow-hidden rounded-[10px] border border-line bg-surface">
          <ConversationList
            conversations={inbox.conversations}
            currentUserId={currentUserId}
            error={inbox.listError}
            loading={inbox.listLoading}
            onLoadMore={inbox.loadMoreConversations}
            onRetry={() => void inbox.loadConversationList(1)}
            onSelect={inbox.selectConversation}
            page={inbox.conversationPage}
            paging={inbox.listPaging}
            selectedConversationId={inbox.selectedConversationId}
          />
          <ConversationThread
            conversationId={inbox.selectedConversationId}
            currentUserId={currentUserId}
            error={inbox.threadError}
            loading={inbox.threadLoading}
            message={inbox.message}
            messages={inbox.visibleMessages}
            onLoadOlder={() => void inbox.loadOlderMessages()}
            onMessageChange={inbox.setMessage}
            onRefresh={() => {
              if (inbox.selectedConversationId) {
                void inbox.refreshThread(inbox.selectedConversationId, true);
              }
            }}
            onRetry={() => {
              if (inbox.selectedConversationId) {
                void inbox.refreshThread(inbox.selectedConversationId, true);
              }
            }}
            onSend={(event) => void inbox.sendMessage(event)}
            pendingInquiry={inbox.hasPendingInquiry}
            refreshing={inbox.threadRefreshing}
            sendError={inbox.sendError}
            sending={inbox.sending}
            thread={inbox.selectedThread}
          />
        </div>
      </div>
    </main>
  );
}
