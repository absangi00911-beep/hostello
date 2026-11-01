"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { ConversationList } from "@/components/messages/ConversationList";
import { ConversationThread } from "@/components/messages/ConversationThread";
import { useMessagesInbox } from "@/components/messages/useMessagesInbox";
import { HostelloBrand } from "@/components/brand/HostelloBrand";

interface MessagesInboxProps {
  currentUserId: string;
}

export function MessagesInbox({ currentUserId }: MessagesInboxProps) {
  const inbox = useMessagesInbox();
  const [mobileThreadVisible, setMobileThreadVisible] = useState(
    Boolean(inbox.selectedConversationId),
  );

  useEffect(() => {
    setMobileThreadVisible(Boolean(inbox.selectedConversationId));
  }, [inbox.selectedConversationId]);

  return (
    <main className="flex min-h-screen flex-col bg-canvas [@media(max-width:720px)]:pb-[calc(64px+env(safe-area-inset-bottom))]">
      <header className="flex min-h-[72px] items-center justify-between gap-5 border-b border-line bg-surface px-5 py-3 md:px-8">
        <HostelloBrand
          className="inline-flex items-center font-black tracking-[-0.04em] text-ink no-underline"
        />
        <div className="inline-flex items-center gap-[22px] text-[0.9rem] font-semibold text-muted">
          <Link className="hover:text-brand-dark" href="/">
            Explore hostels
          </Link>
        </div>
      </header>

      {inbox.hasPendingInquiry && (
        <section
          className="mx-5 mt-4 rounded-lg border border-[#d8bd84] bg-[#fbf4e6] p-4 text-[#583c13] md:mx-8"
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

      <div className="grid min-h-[calc(100dvh-72px)] flex-1 grid-cols-[minmax(320px,390px)_minmax(0,1fr)] overflow-hidden border-b border-line bg-surface [@media(max-width:720px)]:min-h-[calc(100dvh-136px)] [@media(max-width:720px)]:grid-cols-1">
        <div
          className={`min-w-0 ${mobileThreadVisible ? "[@media(max-width:720px)]:hidden" : ""}`}
        >
          <ConversationList
            conversations={inbox.conversations}
            currentUserId={currentUserId}
            error={inbox.listError}
            loading={inbox.listLoading}
            onLoadMore={inbox.loadMoreConversations}
            onRetry={() => void inbox.loadConversationList(1)}
            onSelect={(conversationId) => {
              inbox.selectConversation(conversationId);
              setMobileThreadVisible(true);
            }}
            page={inbox.conversationPage}
            paging={inbox.listPaging}
            searchQuery={inbox.searchQuery}
            onSearchChange={inbox.setSearchQuery}
            onUnreadOnlyChange={inbox.setUnreadOnly}
            onRefresh={() => void inbox.loadConversationList(1)}
            selectedConversationId={inbox.selectedConversationId}
            unreadOnly={inbox.unreadOnly}
          />
        </div>
        <div
          className={`min-w-0 ${mobileThreadVisible ? "" : "[@media(max-width:720px)]:hidden"}`}
        >
          <button
            aria-label="Back to inbox"
            className="hidden min-h-11 items-center gap-2 border-b border-line px-5 text-[0.88rem] font-semibold text-ink [@media(max-width:720px)]:flex"
            onClick={() => setMobileThreadVisible(false)}
            type="button"
          >
            <ArrowLeft aria-hidden="true" size={18} />
            Back to inbox
          </button>
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
